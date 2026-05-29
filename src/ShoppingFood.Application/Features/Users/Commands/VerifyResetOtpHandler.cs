using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class VerifyResetOtpHandler : IRequestHandler<VerifyResetOtpCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;

        public VerifyResetOtpHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(VerifyResetOtpCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.OtpCode))
            {
                return ApiResponse.Failure(400, "Vui lòng nhập đầy đủ thông tin.");
            }

            var otpRecord = await _dbContext.OtpRecords
                .Where(o => o.EmailOrPhone == request.Email && o.OtpCode == request.OtpCode)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (otpRecord == null || otpRecord.IsUsed || otpRecord.ExpiryTime < DateTime.UtcNow)
            {
                return ApiResponse.Failure(400, "Mã OTP không hợp lệ hoặc đã hết hạn.");
            }

            // OTP is valid — don't mark as used yet, that happens when password is actually reset
            return ApiResponse.Success(null, "Mã OTP hợp lệ.");
        }
    }
}
