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
    public class SendProposalHandler : IRequestHandler<SendProposalCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IOrderDeliveryProposalRepository _orderDeliveryProposalRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IOrderDispatchHistoryRepository _orderDispatchHistoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public SendProposalHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IOrderDeliveryProposalRepository orderDeliveryProposalRepository,
            INotificationRepository notificationRepository,
            IOrderDispatchHistoryRepository orderDispatchHistoryRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _orderDeliveryProposalRepository = orderDeliveryProposalRepository;
            _notificationRepository = notificationRepository;
            _orderDispatchHistoryRepository = orderDispatchHistoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(SendProposalCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var authCheck = await CheckAuthorizationAsync(request.CurrentUserId);
                if (authCheck != null) return authCheck;

                var order = await GetOrderAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId.HasValue || order.Status != OrderStatus.WaitingForShipper)
                    return ApiResponse.Failure(400, $"Order is not available for proposal. Current status: {order.Status}");

                var hasActiveProposal = await _orderDeliveryProposalRepository.ExistsAsync(p => 
                    p.OrderId == request.OrderId &&
                    p.Status == ProposalStatus.Pending &&
                    p.ExpiredAt > DateTime.UtcNow);
                if (hasActiveProposal)
                    return ApiResponse.Failure(400, "This order already has an active pending delivery proposal.");

                var shipper = await GetShipperProfileAsync(request.ShipperId);
                if (shipper == null)
                    return ApiResponse.Failure(404, "Active online shipper not found.");

                if (!shipper.IsOnline || shipper.Status != UserStatus.Active)
                    return ApiResponse.Failure(400, "Shipper is offline or inactive");

                CreateProposal(request.OrderId, request.ShipperId);

                var coordinator = (await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId!.Value,
                    include: q => q.Include(u => u.Profile),
                    disableTracking: true
                )).FirstOrDefault();

                var history = new OrderDispatchHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = request.OrderId,
                    ActorId = request.CurrentUserId!.Value,
                    ActorName = coordinator?.Profile?.FullName ?? "Điều phối viên",
                    ActorRole = "Coordinator",
                    ActionType = DispatchActionType.ManualAssigned,
                    TargetShipperId = shipper.Id,
                    TargetShipperName = shipper.UserProfile?.FullName ?? "Shipper",
                    CreatedAt = DateTime.UtcNow
                };
                _orderDispatchHistoryRepository.Add(history);

                AddNotificationToShipper(order, shipper.UserProfile.UserAccountId);
                
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(null, "Proposal sent successfully to the shipper.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("SendProposalHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task<ApiResponse?> CheckAuthorizationAsync(Guid? currentUserId)
        {
            if (!currentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            return null;
        }

        private async Task<Order?> GetOrderAsync(Guid orderId)
        {
            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == orderId,
                include: q => q.Include(o => o.Items),
                disableTracking: true
                );
            return orders.FirstOrDefault();
        }

        private async Task<ShipperProfile?> GetShipperProfileAsync(Guid shipperId)
        {
            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == shipperId,
                include: q => q.Include(s => s.UserProfile),
                disableTracking: true
                );
            return shippers.FirstOrDefault();
        }

        private void CreateProposal(Guid orderId, Guid shipperId)
        {
            var proposal = new OrderDeliveryProposal
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                ShipperId = shipperId,
                Status = ProposalStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                ExpiredAt = DateTime.UtcNow.AddSeconds(60)
            };
            _orderDeliveryProposalRepository.Add(proposal);
        }

        private void AddNotificationToShipper(Order order, Guid shipperUserAccountId)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipperUserAccountId,
                Title = "Đề xuất giao hàng mới",
                Message = $"Bạn nhận được đề xuất giao đơn hàng mã '{order.Id}'. Vui lòng phản hồi trong vòng 60 giây.",
                NotificationType = NotificationType.Delivery,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(notification);
        }
    }
}
