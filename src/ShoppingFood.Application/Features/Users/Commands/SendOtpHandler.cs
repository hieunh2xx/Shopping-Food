using System;
using System.Linq;
using System.Text.RegularExpressions;
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
    public class SendOtpHandler : IRequestHandler<SendOtpCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IStringeeService _stringeeService;

        public SendOtpHandler(ShoppingFoodContext dbContext, IStringeeService stringeeService)
        {
            _dbContext = dbContext;
            _stringeeService = stringeeService;
        }

        public async Task<ApiResponse> Handle(SendOtpCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return ApiResponse.Failure(400, "Phone number is required");
            }

            var phoneRegex = new Regex(@"^(0|\+84)[3|5|7|8|9][0-9]{8}$");
            if (!phoneRegex.IsMatch(request.Phone))
            {
                return ApiResponse.Failure(400, "Invalid phone number format");
            }

            var recentOtps = await _dbContext.OtpRecords
                .Where(o => o.EmailOrPhone == request.Phone && o.CreatedAt >= DateTime.UtcNow.AddMinutes(-10))
                .CountAsync(cancellationToken);

            if (recentOtps >= 5) // Increased limit to 5
            {
                return ApiResponse.Failure(429, "Quá nhiều yêu cầu OTP. Vui lòng thử lại sau 10 phút.");
            }

            // Invalidate all previous unused OTPs for this phone
            var previousOtps = await _dbContext.OtpRecords
                .Where(o => o.EmailOrPhone == request.Phone && !o.IsUsed)
                .ToListAsync(cancellationToken);

            foreach (var otp in previousOtps)
            {
                otp.IsUsed = true;
            }

            // Generate 6-digit OTP
            var otpCode = new Random().Next(100000, 999999).ToString();
            
            var otpRecord = new OtpRecord
            {
                EmailOrPhone = request.Phone,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                IpAddress = request.IpAddress ?? "unknown",
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.OtpRecords.Add(otpRecord);
            
            try
            {
                var smsSuccess = await _stringeeService.SendSmsOtpAsync(request.Phone, otpCode);
                if (!smsSuccess)
                {
                    return ApiResponse.Failure(500, "Failed to send OTP SMS");
                }
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(500, "Error sending SMS: " + ex.Message);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(null, "OTP sent successfully");
        }
    }
}
