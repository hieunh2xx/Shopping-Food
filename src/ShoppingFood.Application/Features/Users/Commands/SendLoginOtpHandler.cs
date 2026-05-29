using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class SendLoginOtpHandler : IRequestHandler<SendLoginOtpCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly IStringeeService _stringeeService;
        private readonly IEmailService _emailService;

        public SendLoginOtpHandler(ShoppingFoodContext dbContext, IConfiguration configuration, IStringeeService stringeeService, IEmailService emailService)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _stringeeService = stringeeService;
            _emailService = emailService;
        }

        public async Task<ApiResponse> Handle(SendLoginOtpCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(request.PreAuthToken)) return ApiResponse.Failure(400, "PreAuthToken is required");

            string username;
            try
            {
                username = TokenHelper.GetUsernameFromToken(request.PreAuthToken, _configuration);
            }
            catch
            {
                return ApiResponse.Failure(401, "Invalid PreAuthToken");
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserName == username, cancellationToken);
            if (user == null) return ApiResponse.Failure(404, "User not found");

            var method = request.Method.ToLower();
            string sendTo = "";
            bool isPhone = false;

            if (method == "email" && !string.IsNullOrEmpty(user.Email))
            {
                sendTo = user.Email;
            }
            else if (method == "phone" && !string.IsNullOrEmpty(user.Phone))
            {
                sendTo = user.Phone;
                isPhone = true;
            }
            else
            {
                return ApiResponse.Failure(400, "Invalid OTP method or contact not available");
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
                    return ApiResponse.Failure(500, "Failed to send OTP");
                }
            }
            catch (Exception ex)
            {
                return ApiResponse.Failure(500, "Error sending OTP: " + ex.Message);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(null, "OTP sent successfully");
        }
    }
}
