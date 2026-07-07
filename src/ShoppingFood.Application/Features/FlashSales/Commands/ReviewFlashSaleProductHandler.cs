using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Migrations;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class ReviewFlashSaleProductHandler : IRequestHandler<ReviewFlashSaleProductCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IFlashSaleProductRepository _flashSaleProductRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ReviewFlashSaleProductHandler(
            IUserRepository userRepository,
            IFlashSaleProductRepository flashSaleProductRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _flashSaleProductRepository = flashSaleProductRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ReviewFlashSaleProductCommand request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            var flashSaleProducts = await _flashSaleProductRepository.GetAsync(
                predicate: fsp => fsp.Id == request.FlashSaleProductId,
                include: q => q.Include(fsp => fsp.Product)
                                    .ThenInclude(p => p.Restaurant)
                                        .ThenInclude(r => r.Owner)
                                            .ThenInclude(up => up.UserAccount),
                disableTracking: false
                );
            var flashSaleProduct = flashSaleProducts.FirstOrDefault();
            if(flashSaleProduct == null)
                return ApiResponse.Failure(404, "Flash sale product not found.");

            if(flashSaleProduct.Status != Domain.Enums.FlashSaleProductStatus.Pending)
                return ApiResponse.Failure(400, "Flash sale product has already been reviewed.");

            if (request.IsApproved)
            {
                flashSaleProduct.Status = Domain.Enums.FlashSaleProductStatus.Approved;
                flashSaleProduct.RejectReason = null;
            }
            else
            {
                flashSaleProduct.Status = Domain.Enums.FlashSaleProductStatus.Rejected;
                flashSaleProduct.RejectReason = request.RejectionReason;
            }    

            AddNotification(flashSaleProduct, request.IsApproved);

            await _unitOfWork.SaveChangesAsync();

            var message = request.IsApproved
                ? "Flash sale product registration approved successfully."
                : "Flash sale product registration rejected.";
            return ApiResponse.Success(null, message);
        }

        private void AddNotification(FlashSaleProduct flashSaleProduct, bool isApproved)
        {
            var sellerUserAccountId = flashSaleProduct.Product?.Restaurant?.Owner?.UserAccountId;
            if (!sellerUserAccountId.HasValue) return;

            var productName = flashSaleProduct.Product?.ItemName ?? "sản phẩm";

            _notificationRepository.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = sellerUserAccountId.Value,
                Title = isApproved
                    ? "Sản phẩm Flash Sale đã được duyệt"
                    : "Sản phẩn Flash Sale bị từ chối",
                Message = isApproved
                    ? $"Sản phẩm \"{productName}\" đã được duyệt tham gia Flash Sale. Sản phẩm sẽ hiển thị khi chương trình bắt đầu."
                    : $"Sản phẩm \"{productName}\" đã bị từ chối tham gia Flash Sale. Lý do: {flashSaleProduct.RejectReason}",
                NotificationType = Domain.Enums.NotificationType.Review,
                IsRead = false,
                CreateAt = DateTime.UtcNow

            });
        }

        
    }
}
