using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UploadAvatarHandler : IRequestHandler<UploadAvatarCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly IPhotoService _photoService;

        public UploadAvatarHandler(ShoppingFoodContext dbContext, IPhotoService photoService)
        {
            _dbContext = dbContext;
            _photoService = photoService;
        }

        public async Task<ApiResponse> Handle(UploadAvatarCommand request, CancellationToken cancellationToken)
        {
            if (request.File == null || request.File.Length == 0)
            {
                return ApiResponse.Failure(400, "Không có file nào được tải lên.");
            }

            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == request.CurrentUserId, cancellationToken);

            if (user == null || user.Profile == null)
            {
                return ApiResponse.Failure(404, "Không tìm thấy người dùng.");
            }

            // Upload to Cloudinary
            var avatarUrl = await _photoService.AddPhotoAsync(request.File);

            if (string.IsNullOrEmpty(avatarUrl))
            {
                return ApiResponse.Failure(500, "Lỗi khi tải ảnh lên Cloudinary.");
            }

            // Optional: You could delete the old avatar from Cloudinary here if you parse the PublicId from the old AvatarUrl

            // Update user profile
            user.Profile.AvatarUrl = avatarUrl;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(new { avatarUrl = avatarUrl }, "Cập nhật ảnh đại diện thành công.");
        }
    }
}
