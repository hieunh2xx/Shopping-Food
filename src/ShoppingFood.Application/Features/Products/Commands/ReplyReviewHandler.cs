using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ShoppingFood.Application.Services;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class ReplyReviewHandler : IRequestHandler<ReplyReviewCommand, ApiResponse>
    {
        private readonly IProductReviewRepository _productReviewRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly BlacklistFilterService _blacklistFilterService;

        public ReplyReviewHandler(
            IProductReviewRepository productReviewRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IUnitOfWork unitOfWork,
            BlacklistFilterService blacklistFilterService)
        {
            _productReviewRepository = productReviewRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _unitOfWork = unitOfWork;
            _blacklistFilterService = blacklistFilterService;
        }

        public async Task<ApiResponse> Handle(ReplyReviewCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            // Guard: chỉ Seller hoặc Mall
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null ||
                (userProfile.Role != UserRole.Seller && userProfile.Role != UserRole.Mall))
                return ApiResponse.Failure(403, "Only sellers can reply to reviews.");

            // Guard: seller phải có nhà hàng
            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.OwnerId == userProfile.Id,
                disableTracking: true
            );
            var restaurant = restaurants.FirstOrDefault();
            if (restaurant == null)
                return ApiResponse.Failure(403, "You do not have a registered restaurant.");

            // Lấy review — include Product để kiểm tra nhà hàng, disableTracking: false để update
            var reviews = await _productReviewRepository.GetAsync(
                predicate: r => r.Id == request.ReviewId,
                include: q => q.Include(r => r.Product),
                disableTracking: false
            );
            var review = reviews.FirstOrDefault();
            if (review == null)
                return ApiResponse.Failure(404, "Review not found.");

            // Guard: review phải thuộc sản phẩm của nhà hàng này (BR36)
            if (review.Product?.RestaurantId != restaurant.Id)
                return ApiResponse.Failure(403, "You can only reply to reviews of your own restaurant.");

            // Guard: 1 review chỉ được phản hồi 1 lần (BR37)
            if (!string.IsNullOrEmpty(review.SellerReply))
                return ApiResponse.Failure(400, "You have already replied to this review.");

            var filteredReply = request.Reply;
            if (!string.IsNullOrWhiteSpace(filteredReply))
            {
                filteredReply = await _blacklistFilterService.FilterContent(filteredReply);
            }

            review.SellerReply = filteredReply;
            review.SellerRepliedAt = DateTime.UtcNow;

            _productReviewRepository.Update(review);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Reply submitted successfully.");
        }
    }
}
