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

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ToggleRestaurantVerificationHandler : IRequestHandler<ToggleRestaurantVerificationCommand, ApiResponse>
    {
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ToggleRestaurantVerificationHandler(
            IRestaurantProfileRepository restaurantRepository, 
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _restaurantRepository = restaurantRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ToggleRestaurantVerificationCommand request, CancellationToken cancellationToken)
        {
            var restaurants = await _restaurantRepository.GetAsync(
                predicate: r => r.Id == request.RestaurantId,
                include: q => q.Include(r => r.Owner),
                disableTracking: false
            );
            var restaurant = restaurants.FirstOrDefault();

            if (restaurant == null)
            {
                return ApiResponse.Failure(404, "Restaurant not found");
            }

            restaurant.IsVerified = !restaurant.IsVerified;
            
            _restaurantRepository.Update(restaurant);

            // Add notification
            if (restaurant.Owner != null)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = restaurant.Owner.UserAccountId,
                    Title = restaurant.IsVerified ? "Quán Ăn Chuẩn" : "Gỡ Nhãn Quán Ăn Chuẩn",
                    Message = restaurant.IsVerified 
                        ? $"Chúc mừng! Quán ăn '{restaurant.RestaurantName}' của bạn đã được công nhận là Quán Ăn Chuẩn." 
                        : $"Rất tiếc! Quán ăn '{restaurant.RestaurantName}' của bạn đã bị gỡ nhãn Quán Ăn Chuẩn.",
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(notification);
            }

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(restaurant.IsVerified, "Restaurant verification toggled successfully");
        }
    }
}
