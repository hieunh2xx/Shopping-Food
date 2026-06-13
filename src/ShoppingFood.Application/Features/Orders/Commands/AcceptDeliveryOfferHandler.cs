using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Order;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class AcceptDeliveryOfferHandler : IRequestHandler<AcceptDeliveryOfferCommand, ApiResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IOrderDeliveryProposalRepository _orderDeliveryProposalRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AcceptDeliveryOfferHandler(
            IOrderRepository orderRepository, 
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            IOrderDeliveryProposalRepository orderDeliveryProposalRepository,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _orderDeliveryProposalRepository = orderDeliveryProposalRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(AcceptDeliveryOfferCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);

                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only shipper can perform this action.");

                if (!shipperProfile.IsOnline)
                    return ApiResponse.Failure(400, "Drivers must switch to online status to receive orders.");

                var hasActiveDelivery = await _orderRepository.ExistsAsync(o => o.ShipperId == shipperProfile.Id && o.Status == OrderStatus.Shipping);
                if (hasActiveDelivery)
                    return ApiResponse.Failure(400, "You have an order being delivered. Please complete the current order before receiving a new one.");

                var order = await GetOrderWithDetailAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId.HasValue)
                    return ApiResponse.Failure(400, "This order has been accepted by another driver.");

                if (order.Status != OrderStatus.WaitingForShipper)
                    return ApiResponse.Failure(400, $"The order is not in waiting for shipper status. Current status: {order.Status}");

                AssignOrderToShipper(order, shipperProfile.Id);

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                AddNotificationForCustomer(order, shipperProfile.UserProfile.FullName);

                var existingProposal = (await _orderDeliveryProposalRepository.GetAsync(
                    predicate: p => p.ShipperId == shipperProfile.Id && p.OrderId == order.Id
                    )).FirstOrDefault();

                if (existingProposal == null)
                {
                    var proposal = new OrderDeliveryProposal
                    {
                        Id = Guid.NewGuid(),
                        ShipperId = shipperProfile.Id,
                        OrderId = order.Id,
                        Status = ProposalStatus.Accepted,
                        CreatedAt = DateTime.UtcNow,
                        ExpiredAt = DateTime.UtcNow
                    };
                    _orderDeliveryProposalRepository.Add(proposal);
                }
                else
                {
                    existingProposal.Status = ProposalStatus.Accepted;
                    _orderDeliveryProposalRepository.Update(existingProposal);
                }
                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(new { order.Id, Status = order.Status.ToString() }, "Successfully received the single delivery proposal.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("AcceptDeliveryOfferHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ShipperProfile?> GetActiveShipperProfileAsync(Guid userId)
        {
            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
                );
            var userProfile = users.FirstOrDefault()?.Profile;

            if (userProfile == null || userProfile.Role != UserRole.Shipper)
                return null;

            var profiles = await _shipperProfileRepository.GetAsync(
                predicate: p => p.UserProfileId == userProfile.Id && p.Status == UserStatus.Active,
                include: q => q.Include(p => p.UserProfile),
                disableTracking: false
                );
            return profiles.FirstOrDefault();
        }

        private async Task<Order?> GetOrderWithDetailAsync(Guid orderId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                disableTracking: false
                );
            return orders.FirstOrDefault();
        }

        private void AssignOrderToShipper(Order order, Guid shipperProfileId)
        {
            order.ShipperId = shipperProfileId;
            order.Status = OrderStatus.Shipping;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
        }

        private void AddNotificationForCustomer(Order order, string shipperName)
        {
            if (order.UserAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Đơn hàng đang được giao",
                    Message = $"Tài xế '{shipperName}' đã nhận vận chuyển đơn hàng mã '{order.Id}' của bạn.",
                    NotificationType = null,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                };
                _notificationRepository.Add(notification);
            }
        }
    }
}
