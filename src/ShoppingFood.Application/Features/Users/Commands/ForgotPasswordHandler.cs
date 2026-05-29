using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ForgotPasswordHandler : IRequestHandler<ForgotPasswordCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IEmailService _emailService;

        public ForgotPasswordHandler(ShoppingFoodContext dbContext, IEmailService emailService)
        {
            _dbContext = dbContext;
            _emailService = emailService;
        }

        public async Task<ApiResponse> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return ApiResponse.Failure(400, "Vui lòng nhập Email.");
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
            if (user == null)
            {
                // To prevent email enumeration, return success even if not found, 
                // but for a better UX let's return an error saying email not found.
                return ApiResponse.Failure(404, "Không tìm thấy tài khoản với email này.");
            }

            // Generate 6-digit OTP
            var otpCode = new Random().Next(100000, 999999).ToString();

            // Store OTP in database
            var otpRecord = new OtpRecord
            {
                Id = Guid.NewGuid(),
                EmailOrPhone = request.Email,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.OtpRecords.Add(otpRecord);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Send via email
            var sent = await _emailService.SendEmailOtpAsync(request.Email, otpCode);

            if (!sent)
            {
                return ApiResponse.Failure(500, "Không thể gửi email OTP lúc này. Vui lòng thử lại sau.");
            }

            return ApiResponse.Success(null, "Mã xác nhận OTP đã được gửi đến email của bạn.");
        }
    }
}
