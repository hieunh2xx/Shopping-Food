using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ResetPasswordHandler : IRequestHandler<ResetPasswordCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;

        public ResetPasswordHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.OtpCode) || string.IsNullOrWhiteSpace(request.NewPassword))
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

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
            if (user == null)
            {
                return ApiResponse.Failure(404, "Không tìm thấy người dùng.");
            }

            // Mark OTP as used
            otpRecord.IsUsed = true;

            // Hash the new password
            string newPasswordHash;
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(request.NewPassword));
                newPasswordHash = Convert.ToBase64String(hashedBytes);
            }

            // Check new password is different from old password
            if (user.PasswordHash == newPasswordHash)
            {
                return ApiResponse.Failure(400, "Mật khẩu mới phải khác mật khẩu cũ.");
            }

            // Reset password
            user.PasswordHash = newPasswordHash;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(null, "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
        }
    }
}
