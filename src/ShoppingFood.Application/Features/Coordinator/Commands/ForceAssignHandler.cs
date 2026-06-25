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

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ForceAssignHandler : IRequestHandler<ForceAssignCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IOrderDeliveryProposalRepository _orderDeliveryProposalRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ForceAssignHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IOrderDeliveryProposalRepository orderDeliveryProposalRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _orderDeliveryProposalRepository = orderDeliveryProposalRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ForceAssignCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var authCheck = await CheckAuthorizationAsync(request.CurrentUserId);
                if (authCheck != null) return authCheck;

                var order = await GetOrderAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId.HasValue || order.Status != OrderStatus.WaitingForShipper)
                    return ApiResponse.Failure(400, $"Order is not eligible for assignment. Current status: {order.Status}.");

                var shipper = await GetShipperProfileAsync(request.ShipperId);
                if (shipper == null)
                    return ApiResponse.Failure(404, "Active online shipper not found");

                if (!shipper.IsOnline || shipper.Status != UserStatus.Active)
                    return ApiResponse.Failure(400, "Shipper ís offline or inactive.");

                var isBusyShipper = await _orderRepository.ExistsAsync(o =>
                    o.ShipperId == shipper.Id && (o.Status == OrderStatus.WaitingForShipper || o.Status == OrderStatus.Shipping));
                if (isBusyShipper)
                    return ApiResponse.Failure(400, "The target shipper already has an active order.");

                await InvalidatePendingProposalAsync(request.OrderId);

                AssignOrder(order, shipper.Id);

                await UpdateOrCreateProposalAsync(request.OrderId, request.ShipperId);

                AddNotifications(order, shipper);
                
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(new { order.Id, Status = order.Status.ToString() }, "Order successfully force assigned to shipper.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ForceAssignHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ApiResponse?> CheckAuthorizationAsync(Guid? currentUserId)
        {
            if (!currentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == currentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var user = users.FirstOrDefault();
            if (user == null || (user.Profile?.Role != UserRole.Coordinator && user.Profile?.Role != UserRole.Admin))
                return ApiResponse.Failure(403, "Access denied. Only coordinators and admins can perform force assignment.");

            return null;
        }

        private async Task<Order?> GetOrderAsync(Guid orderId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                include: q => q.Include(o => o.Items),
                disableTracking: false
                );
            return orders.FirstOrDefault();
        }


        private async Task<ShipperProfile?> GetShipperProfileAsync(Guid shipperId)
        {
            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == shipperId,
                include: q => q.Include(s => s.UserProfile),
                disableTracking: false
                );
            return shippers.FirstOrDefault();
        }

        private async Task InvalidatePendingProposalAsync(Guid orderId)
        {
            var pendingProposal = await _orderDeliveryProposalRepository.GetAsync(
                predicate: p => p.OrderId == orderId && p.Status == ProposalStatus.Pending
                );

            foreach (var proposal in pendingProposal)
            {
                proposal.Status = ProposalStatus.Expired;
                proposal.ExpiredAt = DateTime.UtcNow;
                _orderDeliveryProposalRepository.Update(proposal);
            }
        }

        private void AssignOrder(Order order, Guid shipperId)
        {
            order.ShipperId = shipperId;
            order.Status = OrderStatus.Shipping;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
        }

        private async Task UpdateOrCreateProposalAsync(Guid orderId, Guid shipperId)
        {
            var existingProposal = (
                await _orderDeliveryProposalRepository.GetAsync(
                    predicate: p => p.OrderId == orderId &&
                                    p.ShipperId == shipperId
                )
            ).FirstOrDefault();

            if (existingProposal == null)
            {
                var proposal = new OrderDeliveryProposal
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ShipperId = shipperId,
                    Status = ProposalStatus.Accepted,
                    CreatedAt = DateTime.UtcNow,
                    ExpiredAt = DateTime.UtcNow
                };

                _orderDeliveryProposalRepository.Add(proposal);
            }
            else
            {
                existingProposal.Status = ProposalStatus.Accepted;
                existingProposal.ExpiredAt = DateTime.UtcNow;

                _orderDeliveryProposalRepository.Update(existingProposal);
            }
        }

        private void AddNotifications(Order order, ShipperProfile shipper)
        {
            var shipperNotification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipper.UserProfile.UserAccountId,
                Title = "Đơn hàng gán bắt buộc",
                Message = $"Bạn được gán trực tiếp đơn hàng mã '{order.Id}' từ Điều phối viên.",
                NotificationType = NotificationType.Delivery,
                IsRead = false,
                CreateAt = DateTime.UtcNow,
            };
            _notificationRepository.Add(shipperNotification);

            if (order.UserAccountId.HasValue)
            {
                var customerNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Đơn hàng đang được giao",
                    Message = $"Tài xế '{shipper.UserProfile.FullName}' đã nhận vận chuyển đơn hàng mã '{order.Id}' của bạn.",
                    NotificationType = NotificationType.Delivery,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(customerNotification);
            }
        }
    }
}
