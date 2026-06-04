using MediatR;
using Microsoft.AspNetCore.Http;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class SendCheckoutOtpHandler : IRequestHandler<SendCheckoutOtpCommand, ApiResponse>
    {
        private readonly IOtpRecordRepository _otpRecordRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ShoppingFoodContext _dbContext;

        public SendCheckoutOtpHandler(
            IOtpRecordRepository otpRecordRepository,
            IOrderRepository orderRepository,
            IEmailService emailService,
            IHttpContextAccessor httpContextAccessor,
            IUnitOfWork unitOfWork,
            ShoppingFoodContext dbContext
            ) 
        {
            _otpRecordRepository = otpRecordRepository;
            _orderRepository = orderRepository;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
            _dbContext = dbContext;
        }
        public async Task<ApiResponse> Handle(SendCheckoutOtpCommand request, CancellationToken cancellationToken)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var clientIp = GetClientIpAddress();

                var isLocked = await _otpRecordRepository.ExistsAsync(
                    o => o.IpAddress == clientIp && 
                         o.RetriesCount >= 3 &&
                         o.CreatedAt >= DateTime.UtcNow.AddMinutes(-15)
                    );
                if(isLocked)
                    return ApiResponse.Failure(403, "Checkout is temporarily locked for 15 minutes due to too many failed OTP attempts.");

                var guestOrdersCount = await _orderRepository.GetCountAsync(
                    predicate: o => o.IpAddress == clientIp && 
                               o.GuestUserId != null && 
                               o.CreatedAt >= DateTime.UtcNow.AddDays(-1) 
                    );
                if (guestOrdersCount >= 3)
                    return ApiResponse.Failure(429, "Rate limit exceeded. Maximum of 3 guest orders allowed per 24 hours.");

                var previousOtp = await _otpRecordRepository.GetAsync(
                    predicate: o => o.EmailOrPhone == request.Email && !o.IsUsed,
                    disableTracking: false
                    );
                foreach(var otp in previousOtp)
                {
                    otp.IsUsed = true;
                    _otpRecordRepository.Update(otp);
                }

                await _unitOfWork.SaveChangesAsync();

                await CreateAndSendOtpAsync(request.Email, clientIp);
                transaction.CommitAsync(cancellationToken);
                return ApiResponse.Success(null, "OTP send succcessfully to email");
            }
            catch (Exception ex) 
            {
                await transaction.RollbackAsync(cancellationToken);
                await _unitOfWork.LogErrorAsync("SendCheckoutOtpHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task CreateAndSendOtpAsync(string email, string clientIp)
        {
            var otpCode = new Random().Next(100000, 999999).ToString();
            var otpRecord = new OtpRecord
            {
                EmailOrPhone = email,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                IpAddress = clientIp,
                IsUsed = false,
                RetriesCount = 0,
                CreatedAt = DateTime.UtcNow,
            };

            _otpRecordRepository.Add(otpRecord);
            await _unitOfWork.SaveChangesAsync();

            var subject = "Xác thực đơn hàng - ShoppingFood";
            var body = $"Mã OTP để hoàn tất đặt hàng của bạn là: {otpCode}. Mã có hiệu lực trong 10 phút.";
            await _emailService.SendEmailAsync(email, subject, body);
        }

        private string GetClientIpAddress()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return "127.0.0.1";

            if(context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                var ip = forwardedFor.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
                if (!string.IsNullOrEmpty(ip)) return ip;
            }
            return context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        }
    }
}
