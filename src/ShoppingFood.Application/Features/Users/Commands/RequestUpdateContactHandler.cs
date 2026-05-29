using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class RequestUpdateContactHandler : IRequestHandler<RequestUpdateContactCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IEmailService _emailService;
        private readonly IStringeeService _stringeeService;

        public RequestUpdateContactHandler(ShoppingFoodContext dbContext, IEmailService emailService, IStringeeService stringeeService)
        {
            _dbContext = dbContext;
            _emailService = emailService;
            _stringeeService = stringeeService;
        }

        public async Task<ApiResponse> Handle(RequestUpdateContactCommand request, CancellationToken cancellationToken)
        {
            if (request.CurrentUserId == Guid.Empty)
            {
                return ApiResponse.Failure(401, "Unauthorized");
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.CurrentUserId, cancellationToken);
            if (user == null)
            {
                return ApiResponse.Failure(404, "User not found");
            }

            if (string.IsNullOrEmpty(request.NewEmail) && string.IsNullOrEmpty(request.NewPhone))
            {
                return ApiResponse.Failure(400, "Must provide either new email or new phone.");
            }

            string sendTo = "";
            bool isPhone = false;

            if (!string.IsNullOrEmpty(request.NewEmail))
            {
                var emailExists = await _dbContext.Users.AnyAsync(u => u.Email == request.NewEmail && u.Id != user.Id, cancellationToken);
                if (emailExists) return ApiResponse.Failure(400, "Email already exists.");
                sendTo = request.NewEmail;
            }
            else if (!string.IsNullOrEmpty(request.NewPhone))
            {
                var phoneExists = await _dbContext.Users.AnyAsync(u => u.Phone == request.NewPhone && u.Id != user.Id, cancellationToken);
                if (phoneExists) return ApiResponse.Failure(400, "Phone number already exists.");
                sendTo = request.NewPhone;
                isPhone = true;
            }

            var recentOtps = await _dbContext.OtpRecords
                .Where(o => o.EmailOrPhone == sendTo && o.CreatedAt >= DateTime.UtcNow.AddMinutes(-10))
                .CountAsync(cancellationToken);

            if (recentOtps >= 5) // Increased limit to 5
            {
                return ApiResponse.Failure(429, "Quá nhiều yêu cầu OTP. Vui lòng thử lại sau 10 phút.");
            }

            // Invalidate all previous unused OTPs
            var previousOtps = await _dbContext.OtpRecords
                .Where(o => o.EmailOrPhone == sendTo && !o.IsUsed)
                .ToListAsync(cancellationToken);

            foreach (var otp in previousOtps)
            {
                otp.IsUsed = true;
            }

            var otpCode = new Random().Next(100000, 999999).ToString();
            
            var otpRecord = new OtpRecord
            {
                EmailOrPhone = sendTo,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                IpAddress = request.IpAddress ?? "unknown",
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.OtpRecords.Add(otpRecord);

            try
            {
                bool sendSuccess = false;
                if (isPhone)
                {
                    sendSuccess = await _stringeeService.SendSmsOtpAsync(sendTo, otpCode);
                }
                else
                {
                    sendSuccess = await _emailService.SendEmailOtpAsync(sendTo, otpCode);
                }

                if (!sendSuccess)
                {
                    return ApiResponse.Failure(500, "Failed to send OTP to the new contact");
                }
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(500, "Error sending OTP: " + ex.Message);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(new { Contact = sendTo }, "OTP sent to new contact for verification");
        }
    }
}
