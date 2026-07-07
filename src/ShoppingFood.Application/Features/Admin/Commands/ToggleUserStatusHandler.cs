using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ToggleUserStatusHandler : IRequestHandler<ToggleUserStatusCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ToggleUserStatusHandler(IUserRepository userRepository, IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var existingUsers = await _userRepository.GetAsync(u => u.Id == request.UserId);
                var user = existingUsers.FirstOrDefault();
                
                if (user == null)
                {
                    return ApiResponse.Failure(404, "Không tìm thấy người dùng.");
                }

                // Chuyển đổi trạng thái (nếu đang hoạt động thì khóa, nếu đang khóa thì mở)
                if (user.Status == UserStatus.Active || user.Status == UserStatus.Pending)
                {
                    user.Status = UserStatus.Blocked;
                }
                else
                {
                    user.Status = UserStatus.Active;
                }

                _userRepository.Update(user);
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(null, user.Status == UserStatus.Blocked ? "Đã khóa tài khoản thành công." : "Đã mở khóa tài khoản thành công.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ToggleUserStatusHandler.Handle", ex);
                return ApiResponse.Failure(400, $"Có lỗi xảy ra: {ex.Message}");
            }
        }
    }
}
