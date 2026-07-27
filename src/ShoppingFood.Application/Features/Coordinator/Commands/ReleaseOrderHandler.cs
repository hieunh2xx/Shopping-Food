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
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ReleaseOrderHandler : IRequestHandler<ReleaseOrderCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IOrderDeliveryProposalRepository _orderDeliveryProposalRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IOrderDispatchHistoryRepository _orderDispatchHistoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ReleaseOrderHandler(
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
        public async Task<ApiResponse> Handle(ReleaseOrderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var authCheck = await CheckAuthorizationAsync(request.CurrentUserId);
                if (authCheck != null) return authCheck;

                var order = await GetOrderAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (!order.ShipperId.HasValue)
                    return ApiResponse.Failure(400, "Can not release the order because no shipper is assigned.");

                if (order.Status != OrderStatus.Shipping && order.Status != OrderStatus.WaitingForShipper)
                    return ApiResponse.Failure(400, $"Order status must be Shipper or WaitingForShipper to be released. Current status: {order.Status}");

                var oldShipperId = order.ShipperId.Value;

                // Fetch Coordinator Profile for ActorName
                var coordinator = (await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId!.Value,
                    include: q => q.Include(u => u.Profile),
                    disableTracking: true
                )).FirstOrDefault();
                string actorName = coordinator?.Profile?.FullName ?? "Điều phối viên";

                var oldShippers = await _shipperProfileRepository.GetAsync(
                    predicate: s => s.Id == oldShipperId,
                    include: q => q.Include(s => s.UserProfile),
                    disableTracking: true
                );
                var oldShipper = oldShippers.FirstOrDefault();

                if(request.NewShipperId.HasValue && request.NewShipperId.Value != Guid.Empty)
                {
                    var newShipperId = request.NewShipperId.Value;

                    if (oldShipperId == newShipperId)
                        return ApiResponse.Failure(400, "Cannot reassign the order to the same shipper.");

                    var newShipper = await GetShipperProfileAsync(newShipperId);
                    if (newShipper == null)
                        return ApiResponse.Failure(404, "Target new shipper profile not found.");

                    if (!newShipper.IsOnline || newShipper.Status != UserStatus.Active)
                        return ApiResponse.Failure(400, "Target new shipper is offline or inactive.");



                    AssignNewShipper(order, newShipperId);

                    await UpdateProposalsForReassignAsync(order.Id, oldShipperId, newShipperId);

                    var cancelHistory = new OrderDispatchHistory
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        ActorId = request.CurrentUserId!.Value,
                        ActorName = actorName,
                        ActorRole = "Coordinator",
                        ActionType = DispatchActionType.Canceled,
                        TargetShipperId = oldShipperId,
                        TargetShipperName = oldShipper?.UserProfile?.FullName ?? "Shipper",
                        Note = $"Gỡ đơn để gán cho shipper mới. Lý do: {request.Reason}",
                        CreatedAt = DateTime.UtcNow
                    };
                    _orderDispatchHistoryRepository.Add(cancelHistory);

                    var assignHistory = new OrderDispatchHistory
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        ActorId = request.CurrentUserId!.Value,
                        ActorName = actorName,
                        ActorRole = "Coordinator",
                        ActionType = DispatchActionType.ManualAssigned,
                        TargetShipperId = newShipperId,
                        TargetShipperName = newShipper?.UserProfile?.FullName ?? "Shipper",
                        Note = $"Điều phối lại đơn hàng",
                        CreatedAt = DateTime.UtcNow
                    };
                    _orderDispatchHistoryRepository.Add(assignHistory);

                    await AddReassignNotificationAsync(order, oldShipperId, newShipper, request.Reason);
                }
                else
                {
                    ReleaseOrder(order);

                    await InvalidateAcceptedProposalAsync(order.Id, oldShipperId);

                    var cancelHistory = new OrderDispatchHistory
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        ActorId = request.CurrentUserId!.Value,
                        ActorName = actorName,
                        ActorRole = "Coordinator",
                        ActionType = DispatchActionType.Canceled,
                        TargetShipperId = oldShipperId,
                        TargetShipperName = oldShipper?.UserProfile?.FullName ?? "Shipper",
                        Note = $"Thu hồi đơn hàng. Lý do: {request.Reason}",
                        CreatedAt = DateTime.UtcNow
                    };
                    _orderDispatchHistoryRepository.Add(cancelHistory);

                    await AddNotificationAsync(order, oldShipperId, request.Reason);
                }

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(new {order.Id, Status = order.Status.ToString(), ShipperId = order.ShipperId}, "Order successfully released from shipper.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("ReleaseOrderHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task AddReassignNotificationAsync(Order order, Guid oldShipperId, ShipperProfile newShipper
            , string reason)
        {
            var oldShippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == oldShipperId,
                include: q => q.Include(s => s.UserProfile),
                disableTracking: true
            );
            var oldShipper = oldShippers.FirstOrDefault();
            if (oldShipper != null)
            {
                var oldNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = oldShipper.UserProfile.UserAccountId,
                    Title = "Đơn hàng đã được chuyển giao",
                    Message = $"Đơn hàng mã '{order.Id}' của bạn đã bị chuyển cho tài xế khác. Lý do: {reason}",
                    NotificationType = NotificationType.Delivery,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(oldNotification);
            }
            var newNotification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = newShipper.UserProfile.UserAccountId,
                Title = "Bạn có đơn hàng mới",
                Message = $"Bạn được gán trực tiếp đơn hàng mã '{order.Id}' từ Điều phối viên.",
                NotificationType = NotificationType.Delivery,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(newNotification);
            if (order.UserAccountId.HasValue)
            {
                var customerNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Đơn hàng thay đổi tài xế",
                    Message = $"Đơn hàng mã '{order.Id}' của bạn đã được chuyển giao cho tài xế mới: '{newShipper.UserProfile.FullName}'.",
                    NotificationType = NotificationType.Delivery,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add(customerNotification);
            }
        }

        private async Task UpdateProposalsForReassignAsync(Guid orderId, Guid oldShipperId, Guid newShipperId)
        {
            await InvalidateAcceptedProposalAsync(orderId, oldShipperId);
            var existingNewProposal = (await _orderDeliveryProposalRepository.GetAsync(
                predicate: p => p.OrderId == orderId && p.ShipperId == newShipperId
            )).FirstOrDefault();
            if (existingNewProposal == null)
            {
                var proposal = new OrderDeliveryProposal
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ShipperId = newShipperId,
                    Status = ProposalStatus.Accepted,
                    CreatedAt = DateTime.UtcNow,
                    ExpiredAt = DateTime.UtcNow
                };
                _orderDeliveryProposalRepository.Add(proposal);
            }
            else
            {
                existingNewProposal.Status = ProposalStatus.Accepted;
                existingNewProposal.ExpiredAt = DateTime.UtcNow;
                _orderDeliveryProposalRepository.Update(existingNewProposal);
            }
        }

        private void AssignNewShipper(Order order, Guid newShipperId)
        {
            order.ShipperId = newShipperId;
            order.Status = OrderStatus.Shipping;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
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
                disableTracking: false
                );
            return orders.FirstOrDefault();
        }

        private void ReleaseOrder(Order order)
        {
            order.ShipperId = null;
            order.Status = OrderStatus.WaitingForShipper;
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);
        }

        private async Task InvalidateAcceptedProposalAsync(Guid orderId, Guid shipperId)
        {
            var proposals = await _orderDeliveryProposalRepository.GetAsync(
                predicate: p => p.OrderId == orderId && p.ShipperId == shipperId && p.Status == ProposalStatus.Accepted
                );
            foreach(var proposal in proposals )
            {
                proposal.Status = ProposalStatus.Expired;
                proposal.ExpiredAt = DateTime.UtcNow;
                _orderDeliveryProposalRepository.Update(proposal);
            }
        }

        private async Task AddNotificationAsync(Order order, Guid shipperId, string reason)
        {
            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == shipperId,
                include: q => q.Include(s => s.UserProfile),
                disableTracking: true
                );
            var shipper = shippers.FirstOrDefault();

            if(shipper != null)
            {
                var shipperNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = shipper.UserProfile.UserAccountId,
                    Title = "Thu hồi đơn hàng",
                    Message = $"Đơn hàng mã '{order.Id}' của bạn đã bị thu hồi bởi Điều phối viên. Lý do: {reason}",
                    NotificationType = NotificationType.Delivery,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add( shipperNotification );
            }

            if (order.UserAccountId.HasValue)
            {
                var customerNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Đơn hàng đang được điều phối lại",
                    Message = $"Đơn hàng mã '{order.Id}' của bạn đang được tìm kiếm tài xế mới.",
                    NotificationType = NotificationType.Delivery,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };
                _notificationRepository.Add( customerNotification );
            }
        }
    }
}
