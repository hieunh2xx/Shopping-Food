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

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class RejectDeliveryOfferHandler : IRequestHandler<RejectDeliveryOfferCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IOrderDeliveryProposalRepository _orderDeliveryProposalRepository;
        private readonly IOrderDispatchHistoryRepository _orderDispatchHistoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RejectDeliveryOfferHandler(
            IShipperProfileRepository shipperProfileRepository,
            IUserRepository userRepository,
            IOrderDeliveryProposalRepository orderDeliveryProposalRepository,
            IOrderDispatchHistoryRepository orderDispatchHistoryRepository,
            IUnitOfWork unitOfWork)
        {
            _shipperProfileRepository = shipperProfileRepository;
            _userRepository = userRepository;
            _orderDeliveryProposalRepository = orderDeliveryProposalRepository;
            _orderDispatchHistoryRepository = orderDispatchHistoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(RejectDeliveryOfferCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "Unauthorized.");

                var shipperProfile = await GetActiveShipperProfileAsync(request.CurrentUserId.Value);
                if (shipperProfile == null)
                    return ApiResponse.Failure(403, "Forbidden. Only active shipper can reject orders.");

                var existingProposal = (await _orderDeliveryProposalRepository.GetAsync(
                    predicate: r => r.ShipperId == shipperProfile.Id && r.OrderId == request.OrderId
                    )).FirstOrDefault();

                var status = request.IsExpired ? ProposalStatus.Expired : ProposalStatus.Rejected;

                if (existingProposal == null)
                {
                    var proposal = new OrderDeliveryProposal
                    {
                        Id = Guid.NewGuid(),
                        ShipperId = shipperProfile.Id,
                        OrderId = request.OrderId,
                        Status = status,
                        CreatedAt = DateTime.UtcNow,
                        ExpiredAt = DateTime.UtcNow.AddSeconds(60)
                    };
                    _orderDeliveryProposalRepository.Add(proposal);
                }
                else
                {
                    existingProposal.Status = status;
                    existingProposal.ExpiredAt = DateTime.UtcNow;
                    _orderDeliveryProposalRepository.Update(existingProposal);
                }

                var history = new OrderDispatchHistory
                {
                    Id = Guid.NewGuid(),
                    OrderId = request.OrderId,
                    ActorId = request.CurrentUserId.Value,
                    ActorName = shipperProfile.UserProfile.FullName,
                    ActorRole = "Shipper",
                    ActionType = request.IsExpired ? DispatchActionType.Expired : DispatchActionType.Rejected,
                    TargetShipperId = shipperProfile.Id,
                    TargetShipperName = shipperProfile.UserProfile.FullName,
                    Note = request.IsExpired ? "Đề xuất hết hạn (Shipper không phản hồi)" : "Shipper từ chối đơn hàng",
                    CreatedAt = DateTime.UtcNow
                };
                _orderDispatchHistoryRepository.Add(history);

                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(null, "Offer interaction recorded successfully.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("RejectDeliveryOfferHandler.Handle", ex);
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
            if (userProfile == null || userProfile.Role != Domain.Enums.UserRole.Shipper)
                return null;

            var profiles = await _shipperProfileRepository.GetAsync(
                predicate: p => p.UserProfileId == userProfile.Id && p.Status == Domain.Enums.UserStatus.Active,
                include: q => q.Include(p => p.UserProfile),
                disableTracking: false
                );
            return profiles.FirstOrDefault();
        }
    }
}
