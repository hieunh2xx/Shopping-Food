using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
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
        private readonly IOrderDispatchHistoryRepository _orderDispatchHistoryRepository;
        private readonly IOrderShipperClaimService _claimService;
        private readonly IUnitOfWork _unitOfWork;

        public AcceptDeliveryOfferHandler(
            IOrderRepository orderRepository,
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            IOrderDeliveryProposalRepository orderDeliveryProposalRepository,
            IOrderDispatchHistoryRepository orderDispatchHistoryRepository,
            IOrderShipperClaimService claimService,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _orderDeliveryProposalRepository = orderDeliveryProposalRepository;
            _orderDispatchHistoryRepository = orderDispatchHistoryRepository;
            _claimService = claimService;
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

                var order = await GetOrderWithDetailAsync(request.OrderId);
                if (order == null)
                    return ApiResponse.Failure(404, "Order not found.");

                if (order.ShipperId.HasValue)
                    return ApiResponse.Failure(409, "Đơn hàng đã được tài xế khác nhận.");

                if (order.Status != OrderStatus.WaitingForShipper)
                    return ApiResponse.Failure(400, $"Đơn không còn ở trạng thái chờ tài xế. Hiện tại: {order.Status}");

                // Claim nguyên tử — chống 2 shipper nhận cùng lúc
                var claimed = await _claimService.TryClaimAsync(order.Id, shipperProfile.Id, cancellationToken);
                if (!claimed)
                    return ApiResponse.Failure(409, "Đơn hàng đã được tài xế khác nhận. Vui lòng chọn đơn khác.");

                // Đồng bộ entity trong memory với DB (tránh SaveChanges ghi đè)
                order.ShipperId = shipperProfile.Id;
                order.Status = OrderStatus.Shipping;
                order.UpdatedAt = DateTime.UtcNow;

                shipperProfile.Latitude = request.Latitude;
                shipperProfile.Longitude = request.Longitude;
                shipperProfile.UpdatedAt = DateTime.UtcNow;
                _shipperProfileRepository.Update(shipperProfile);

                AddNotificationForCustomer(order, shipperProfile.UserProfile.FullName);

                // Hết hạn proposal Pending của shipper khác (nếu có)
                await ExpireOtherPendingProposalsAsync(order.Id, shipperProfile.Id);

                var existingProposal = (await _orderDeliveryProposalRepository.GetAsync(
                    predicate: p => p.ShipperId == shipperProfile.Id && p.OrderId == order.Id
                )).FirstOrDefault();

                if (existingProposal == null)
                {
                    _orderDeliveryProposalRepository.Add(new OrderDeliveryProposal
                    {
                        Id = Guid.NewGuid(),
                        ShipperId = shipperProfile.Id,
                        OrderId = order.Id,
                        Status = ProposalStatus.Accepted,
                        CreatedAt = DateTime.UtcNow,
                        ExpiredAt = DateTime.UtcNow
                    });
                }
                else
                {
                    existingProposal.Status = ProposalStatus.Accepted;
                    _orderDeliveryProposalRepository.Update(existingProposal);
                }

                _orderDispatchHistoryRepository.Add(new OrderDispatchHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    ActorId = request.CurrentUserId.Value,
                    ActorName = shipperProfile.UserProfile.FullName,
                    ActorRole = "Shipper",
                    ActionType = DispatchActionType.Accepted,
                    TargetShipperId = shipperProfile.Id,
                    TargetShipperName = shipperProfile.UserProfile.FullName,
                    CreatedAt = DateTime.UtcNow
                });

                await _unitOfWork.SaveChangesAsync();

                return ApiResponse.Success(new { order.Id, Status = order.Status.ToString() }, "Nhận đơn thành công.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("AcceptDeliveryOfferHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private async Task ExpireOtherPendingProposalsAsync(Guid orderId, Guid winnerShipperId)
        {
            var pending = await _orderDeliveryProposalRepository.GetAsync(
                predicate: p =>
                    p.OrderId == orderId
                    && p.ShipperId != winnerShipperId
                    && p.Status == ProposalStatus.Pending
            );
            foreach (var proposal in pending)
            {
                proposal.Status = ProposalStatus.Expired;
                proposal.ExpiredAt = DateTime.UtcNow;
                _orderDeliveryProposalRepository.Update(proposal);
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

        private void AddNotificationForCustomer(Order order, string shipperName)
        {
            if (order.UserAccountId.HasValue)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = order.UserAccountId.Value,
                    Title = "Tài xế đã nhận giao đơn",
                    Message = $"Tài xế {shipperName} đã nhận giao đơn #{Common.OrderDisplayHelper.ShortId(order.Id)}. Đơn sẽ sớm được lấy tại nhà hàng và giao tới bạn.",
                    NotificationType = NotificationType.Delivery,
                    TargetId = order.Id,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                });
            }
        }
    }
}
