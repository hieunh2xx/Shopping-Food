using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Payments.Queries
{
    public class GetCodRemittanceRequestsQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public string? Status { get; set; }
        public int Skip { get; set; } = 0;
        public int Take { get; set; } = 50;
    }

    public class GetCodRemittanceRequestsHandler : IRequestHandler<GetCodRemittanceRequestsQuery, ApiResponse>
    {
        private readonly ICodRemittanceRequestRepository _remittanceRepository;
        private readonly IUserRepository _userRepository;
        private readonly IShipperProfileRepository _shipperRepository;

        public GetCodRemittanceRequestsHandler(
            ICodRemittanceRequestRepository remittanceRepository,
            IUserRepository userRepository,
            IShipperProfileRepository shipperRepository)
        {
            _remittanceRepository = remittanceRepository;
            _userRepository = userRepository;
            _shipperRepository = shipperRepository;
        }

        public async Task<ApiResponse> Handle(GetCodRemittanceRequestsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            var profile = users.FirstOrDefault()?.Profile;
            if (profile == null)
                return ApiResponse.Failure(404, "User profile not found.");

            CodRemittanceStatus? statusFilter = null;
            if (!string.IsNullOrWhiteSpace(request.Status) &&
                Enum.TryParse<CodRemittanceStatus>(request.Status, true, out var parsed))
            {
                statusFilter = parsed;
            }

            Guid? shipperOnlyId = null;
            if (profile.Role == UserRole.Shipper)
            {
                var shippers = await _shipperRepository.GetAsync(
                    predicate: s => s.UserProfileId == profile.Id,
                    disableTracking: true);
                var shipper = shippers.FirstOrDefault();
                if (shipper == null)
                    return ApiResponse.Failure(404, "Shipper profile not found.");
                shipperOnlyId = shipper.Id;
            }
            else if (profile.Role != UserRole.Admin && profile.Role != UserRole.Coordinator)
            {
                return ApiResponse.Failure(403, "Forbidden.");
            }

            var take = request.Take <= 0 ? 50 : Math.Min(request.Take, 200);
            var skip = Math.Max(0, request.Skip);

            var all = await _remittanceRepository.GetAsync(
                predicate: r =>
                    (!shipperOnlyId.HasValue || r.ShipperProfileId == shipperOnlyId.Value) &&
                    (!statusFilter.HasValue || r.Status == statusFilter.Value),
                include: q => q
                    .Include(r => r.ShipperProfile).ThenInclude(s => s.UserProfile).ThenInclude(p => p!.UserAccount),
                orderBy: q => q.OrderByDescending(r => r.CreatedAt),
                skip: skip,
                take: take,
                disableTracking: true);

            var total = await _remittanceRepository.GetCountAsync(
                predicate: r =>
                    (!shipperOnlyId.HasValue || r.ShipperProfileId == shipperOnlyId.Value) &&
                    (!statusFilter.HasValue || r.Status == statusFilter.Value));

            var items = all.Select(r => new
            {
                id = r.Id,
                shipperProfileId = r.ShipperProfileId,
                shipperName = r.ShipperProfile?.UserProfile?.FullName ?? "—",
                phone = r.ShipperProfile?.UserProfile?.UserAccount?.Phone,
                amount = r.Amount,
                note = r.Note,
                proofImageUrl = r.ProofImageUrl,
                status = r.Status.ToString(),
                rejectReason = r.RejectReason,
                reviewedAt = r.ReviewedAt,
                createdAt = r.CreatedAt,
                currentCodDebt = r.ShipperProfile?.CodCollectedAmount ?? 0
            }).ToList();

            var pendingCount = await _remittanceRepository.GetCountAsync(
                predicate: r =>
                    (!shipperOnlyId.HasValue || r.ShipperProfileId == shipperOnlyId.Value) &&
                    r.Status == CodRemittanceStatus.Pending);

            return ApiResponse.Success(new
            {
                items,
                pendingCount,
                total
            }, "COD remittance requests retrieved.", total);
        }
    }
}
