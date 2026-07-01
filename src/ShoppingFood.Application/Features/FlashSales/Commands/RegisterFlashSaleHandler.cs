using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.FlashSales.Commands
{
    public class RegisterFlashSaleHandler : IRequestHandler<RegisterFlashSaleCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;
        private readonly IFlashSaleRepository _flashSaleRepository;
        private readonly IProductRepository _productRepository;
        private readonly IFlashSaleProductRepository _flashSaleProductRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RegisterFlashSaleHandler(
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository,
            IFlashSaleRepository flashSaleRepository,
            IProductRepository productRepository,
            IFlashSaleProductRepository flashSaleProductRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;
            _flashSaleRepository = flashSaleRepository;
            _productRepository = productRepository;
            _flashSaleProductRepository = flashSaleProductRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(RegisterFlashSaleCommand request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if(userProfile == null || (userProfile.Role != UserRole.Mall && userProfile.Role != UserRole.Seller))
                return ApiResponse.Failure(403, "Forbidden. Only sellers can register for flash sales.");

            var restaurants = await _restaurantProfileRepository.GetAsync(
                predicate: r => r.OwnerId == userProfile.Id,
                disableTracking: true
                );
            var restaurant = restaurants.FirstOrDefault();
            if(restaurant == null)
                return ApiResponse.Failure(404, "Restaurant profile not found for the current user.");

            var flashSales = await _flashSaleRepository.GetAsync(
                predicate: fs => fs.Id == request.FlashSaleId && !fs.IsDeleted,
                disableTracking: true
                );
            var flashSale = flashSales.FirstOrDefault();
            if(flashSale == null)
                return ApiResponse.Failure(404, "Flash sale not found.");
            if(flashSale.Status != FlashSaleStatus.Pending)
                return ApiResponse.Failure(400, $"Cannot register for a flash sale with status '{flashSale.Status}'. Only Pending flash sales accept registrations.");

            var product = await _productRepository.GetByIdAsync(request.ProductId);
            if(product == null || product.IsHidden)
                return ApiResponse.Failure(404, "Product not found or is hidden.");
            if(product.RestaurantId != restaurant.Id)
                return ApiResponse.Failure(403, "You can only register products from your own restaurant for flash sales.");
            if(product.Status != ProductStatus.Approved)
                return ApiResponse.Failure(400, "Only approved products can be registered for flash sales.");

            if(request.FlashSalePrice >= product.Price)
                return ApiResponse.Failure(400, "Flash sale price must be lower than the original product price.");

            var alreadyRegistered = await _flashSaleProductRepository.ExistsAsync(
                predicate: fsp => fsp.FlashSaleId == request.FlashSaleId && fsp.ProductId == request.ProductId
                );
            if(alreadyRegistered)
                return ApiResponse.Failure(400, "This product is already registered for this flash sale.");

            var flashSaleProduct = new FlashSaleProduct
            {
                Id = Guid.NewGuid(),
                FlashSaleId = request.FlashSaleId,
                ProductId = request.ProductId,
                FlashSalePrice = request.FlashSalePrice,
                QuantityLimit = request.QuantityLimit,
                SoldQuantity = 0,
                Status = FlashSaleProductStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _flashSaleProductRepository.Add(flashSaleProduct);

            await NotifyAdminAsync(flashSaleProduct, product.ItemName, restaurant);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(
                new {FlashSaleProductId = flashSaleProduct.Id}, "Product registered for flash sale successfully. Pending admin approval.");
        }

        private async Task NotifyAdminAsync(FlashSaleProduct flashSaleProduct, string itemName, RestaurantProfile restaurant)
        {
            var admins = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && u.Profile.Role == UserRole.Admin,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );

            foreach(var admin in admins)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = admin.Id,
                    Title = "Yêu cầu tham gia Flash Sale mới",
                    Message = $"Sản phẩm \"{itemName}\" của nhà hàng \"{restaurant.RestaurantName}\" đang chờ bạn phê duyệt tham gia Flash Sale.",
                    NotificationType = NotificationType.Review,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(notification);
            }
        }
    }
}
