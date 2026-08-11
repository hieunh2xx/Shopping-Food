using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Coordinator.Queries
{
    public class GetOrderExplanationHandler : IRequestHandler<GetOrderExplanationQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IOrderExplanationRequestRepository _explanationRepository;

        public GetOrderExplanationHandler(
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            IOrderExplanationRequestRepository explanationRepository)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _explanationRepository = explanationRepository;
        }

        public async Task<ApiResponse> Handle(GetOrderExplanationQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
            );
            var profile = users.FirstOrDefault()?.Profile;
            if (profile == null)
                return ApiResponse.Failure(401, "User profile not found.");

            var isStaff = profile.Role == UserRole.Coordinator || profile.Role == UserRole.Admin;
            var isShipper = profile.Role == UserRole.Shipper;

            if (!isStaff && !isShipper)
                return ApiResponse.Failure(403, "Forbidden.");

            if (isShipper)
            {
                var orders = await _orderRepository.GetAsync(
                    predicate: o => o.Id == request.OrderId && o.Shipper != null && o.Shipper.UserProfileId == profile.Id,
                    include: q => q.Include(o => o.Shipper),
                    disableTracking: true
                );
                if (!orders.Any())
                    return ApiResponse.Failure(403, "Forbidden.");
            }

            var items = await _explanationRepository.GetAsync(
                predicate: e => e.OrderId == request.OrderId,
                orderBy: q => q.OrderByDescending(e => e.CreatedAt),
                include: q => q.Include(e => e.RequestedBy),
                disableTracking: true
            );

            var dto = items.Select(e => new
            {
                e.Id,
                e.OrderId,
                e.RequestMessage,
                Status = e.Status.ToString(),
                e.ShipperReply,
                e.CreatedAt,
                e.RepliedAt,
                requestedByName = e.RequestedBy?.FullName
            }).ToList();

            return ApiResponse.Success(dto, "Explanation requests retrieved.");
        }
    }
}
