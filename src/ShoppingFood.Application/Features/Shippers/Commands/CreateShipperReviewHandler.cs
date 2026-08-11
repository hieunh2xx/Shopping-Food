using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Shippers.Commands
{
    public class CreateShipperReviewHandler : IRequestHandler<CreateShipperReviewCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IShipperReviewRepository _shipperReviewRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateShipperReviewHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IShipperReviewRepository shipperReviewRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _shipperReviewRepository = shipperReviewRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(CreateShipperReviewCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            // Guard: chỉ Customer
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != UserRole.Customer)
                return ApiResponse.Failure(403, "Only customers can review shippers.");

            // Lấy order
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == request.OrderId,
                disableTracking: true
            );
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Order not found.");

            // Guard: đơn phải thuộc về user này
            if (order.UserAccountId != request.CurrentUserId.Value)
                return ApiResponse.Failure(403, "You can only review shippers for your own orders.");

            // Guard: đơn đã giao hoặc bị hủy khi đang giao (có tài xế)
            if (order.Status != OrderStatus.Delivered && order.Status != OrderStatus.Cancelled)
                return ApiResponse.Failure(400, "Chỉ có thể đánh giá tài xế khi đơn đã giao hoặc đã hủy.");

            if (order.Status == OrderStatus.Cancelled && !order.ShipperId.HasValue)
                return ApiResponse.Failure(400, "Đơn hủy này không có tài xế để đánh giá.");

            // Guard: đơn phải có tài xế
            if (!order.ShipperId.HasValue)
                return ApiResponse.Failure(400, "This order was not delivered by a shipper.");

            // Guard: chưa review đơn này
            var alreadyReviewed = await _shipperReviewRepository.ExistsAsync(
                r => r.OrderId == request.OrderId
            );
            if (alreadyReviewed)
                return ApiResponse.Failure(400, "You have already reviewed the shipper for this order.");

            // Tạo review
            var review = new ShipperReview
            {
                Id = Guid.NewGuid(),
                OrderId = request.OrderId,
                ShipperProfileId = order.ShipperId.Value,
                ReviewerAccountId = request.CurrentUserId.Value,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow
            };
            _shipperReviewRepository.Add(review);

            // Cập nhật ShipperProfile.Rating = trung bình tất cả reviews
            await RecalculateShipperRatingAsync(order.ShipperId.Value, request.Rating);

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Shipper review submitted successfully.");
        }

        private async Task RecalculateShipperRatingAsync(Guid shipperProfileId, int newRating)
        {
            // Lấy tất cả reviews hiện có (chưa bao gồm review vừa Add ở trên vì chưa SaveChanges)
            var existingReviews = await _shipperReviewRepository.GetAsync(
                predicate: r => r.ShipperProfileId == shipperProfileId,
                disableTracking: true
            );

            var totalRating = existingReviews.Sum(r => r.Rating) + newRating;
            var totalCount = existingReviews.Count + 1;
            var newAverage = Math.Round((double)totalRating / totalCount, 1);

            var shipperProfiles = await _shipperProfileRepository.GetAsync(
                predicate: sp => sp.Id == shipperProfileId,
                disableTracking: false
            );
            var shipperProfile = shipperProfiles.FirstOrDefault();
            if (shipperProfile != null)
            {
                shipperProfile.Rating = newAverage;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);
            }
        }
    }
}
