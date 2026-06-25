using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UploadImageHandler : IRequestHandler<UploadImageCommand, ApiResponse>
    {
        private readonly IPhotoService _photoService;

        public UploadImageHandler(IPhotoService photoService)
        {
            _photoService = photoService;
        }

        public async Task<ApiResponse> Handle(UploadImageCommand request, CancellationToken cancellationToken)
        {
            if (request.File == null || request.File.Length == 0)
            {
                return ApiResponse.Failure(400, "Không có file nào được tải lên.");
            }

            var extension = System.IO.Path.GetExtension(request.File.FileName).ToLower();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx" };
            if (!System.Linq.Enumerable.Contains(allowedExtensions, extension))
            {
                return ApiResponse.Failure(400, "Chỉ cho phép tải lên các tệp ảnh hoặc tài liệu (.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx).");
            }

            // Upload to Cloudinary
            var imageUrl = await _photoService.AddPhotoAsync(request.File);

            if (string.IsNullOrEmpty(imageUrl))
            {
                return ApiResponse.Failure(500, "Lỗi khi tải ảnh lên Cloudinary.");
            }

            return ApiResponse.Success(new { imageUrl = imageUrl }, "Tải ảnh lên thành công.");
        }
    }
}
