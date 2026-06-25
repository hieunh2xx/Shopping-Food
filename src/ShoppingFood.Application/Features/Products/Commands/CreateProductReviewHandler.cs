using AutoMapper;
using ShoppingFood.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class CreateProductReviewHandler : IRequestHandler<CreateProductReviewCommand, ApiResponse>
    {
        private readonly IProductReviewRepository _productReviewRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ShoppingFoodContext _dbContext;

        public CreateProductReviewHandler(
            IProductReviewRepository productReviewRepository,
            IProductRepository productRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ShoppingFoodContext dbContext)
        {
            _productReviewRepository = productReviewRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _dbContext = dbContext;
        }
        public async Task<ApiResponse> Handle(CreateProductReviewCommand request, CancellationToken cancellationToken)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var products = await _productRepository.GetAsync(
                    predicate: p => p.Id == request.ProductId,
                    include: q => q.Include(p => p.Restaurant).ThenInclude(r => r.Owner)
                    );

                var product = products.FirstOrDefault();
                if (product == null)
                    return ApiResponse.Failure(404, "Product not found");

                var userProfile = await GetUserProfileAsync(request.CurrentUserId.Value);
                if (userProfile == null)
                    return ApiResponse.Failure(404, "User profile not found");

                var review = await CreateProductReviewAsync(request.ProductId, userProfile.Id, request.Rating, request.Comment);

                review.UserProfile = userProfile;

                await RecalculateRestaurantRatingAsync(product.RestaurantId);

                SendReviewNotification(product, userProfile, request.Rating);
                await _unitOfWork.SaveChangesAsync();

                await transaction.CommitAsync(cancellationToken);

                var reviewDto = _mapper.Map<ProductReviewDto>(review);
                return ApiResponse.Success(reviewDto, "Submit review successfully");
            }
            catch (Exception ex) 
            {
                await transaction.RollbackAsync(cancellationToken);
                await _unitOfWork.LogErrorAsync("CreateProductReviewHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<UserProfile?> GetUserProfileAsync(Guid userId)
        {
            var userProfile = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );
            return userProfile.FirstOrDefault()?.Profile;
        }

        private async Task<ProductReview> CreateProductReviewAsync(Guid productId, Guid userProfileId, int rating, string? comment)
        {
            var review = new ProductReview
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                UserProfileId = userProfileId,
                Rating = rating,
                Comment = comment,
                CreatedAt = DateTime.UtcNow
            };

            _productReviewRepository.Add(review);
            await _unitOfWork.SaveChangesAsync();
            return review;
        }

        private async Task RecalculateRestaurantRatingAsync(Guid restaurantId)
        {
            var allReviews = await _productReviewRepository.GetAsync(
                predicate: r => r.Product.RestaurantId == restaurantId,
                include: q => q.Include(r  => r.Product)
                );

            var reviewCount = allReviews.Count;
            var avarageRating = reviewCount > 0 ? allReviews.Average(r => r.Rating) : 0.0;
            avarageRating = Math.Round(avarageRating, 1);

            var restaurant = await _restaurantProfileRepository.GetByIdAsync(restaurantId);

            if(restaurant != null)
            {
                restaurant.AverageRating = avarageRating;
                restaurant.ReviewCount = reviewCount;
                restaurant.UpdatedAt = DateTime.UtcNow;

                _restaurantProfileRepository.Update(restaurant);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        private void SendReviewNotification(Product product, UserProfile customerProfile, int rating)
        {
            var ownerUserAccountId = product.Restaurant?.Owner?.UserAccountId;
            if(ownerUserAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = ownerUserAccountId.Value,
                    Title = "Món ăn nhận được đánh giá mới",
                    Message = $"Món ăn '{product.ItemName}' của bạn vừa nhận được đánh giá {rating} sao từ khách hành '{customerProfile.FullName}'.",
                    NotificationType = NotificationType.Review,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };

                _notificationRepository.Add(notification);
            }
        }
    }
}
