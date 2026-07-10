using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Security;
using ShoppingFood.Domain.Context;
using System.Text;
namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ChangePasswordHandler : IRequestHandler<ChangePasswordCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;

        public ChangePasswordHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.OldPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return ApiResponse.Failure(400, "Vui lòng nhập đầy đủ mật khẩu cũ và mới.");
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.CurrentUserId, cancellationToken);
            if (user == null)
            {
                return ApiResponse.Failure(404, "Không tìm thấy người dùng.");
            }

            using (var sha256 = SHA256.Create())
            {
                var oldHashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(request.OldPassword));
                var oldHash = Convert.ToBase64String(oldHashedBytes);
                if (oldHash != user.PasswordHash)
                {
                    return ApiResponse.Failure(400, "Mật khẩu cũ không chính xác.");
                }

                var newHashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(request.NewPassword));
                user.PasswordHash = Convert.ToBase64String(newHashedBytes);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(null, "Thay đổi mật khẩu thành công.");
        }
    }
}
