using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Shippers.Queries
{
    public class GetReputationHistoryHandler : IRequestHandler<GetReputationHistoryQuery, ApiResponse>
    {
        private readonly IShipperReputationHistoryRepository _reputationHistoryRepository;
        private readonly IShipperProfileRepository _shipperProfileRepository;

        public GetReputationHistoryHandler(
            IShipperReputationHistoryRepository reputationHistoryRepository,
            IShipperProfileRepository shipperProfileRepository)
        {
            _reputationHistoryRepository = reputationHistoryRepository;
            _shipperProfileRepository = shipperProfileRepository;
        }

        public async Task<ApiResponse> Handle(GetReputationHistoryQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.UserProfile.UserAccountId == request.CurrentUserId.Value,
                disableTracking: true);

            var shipper = shippers.FirstOrDefault();
            if (shipper == null)
                return ApiResponse.Failure(404, "Shipper profile not found.");

            var histories = await _reputationHistoryRepository.GetAsync(
                predicate: h => h.ShipperProfileId == shipper.Id,
                orderBy: q => q.OrderByDescending(h => h.CreatedAt),
                disableTracking: true);

            var result = histories.Select(h => new
            {
                h.Id,
                h.OrderId,
                h.PointChange,
                h.Reason,
                h.CreatedAt
            }).ToList();

            return ApiResponse.Success(result, "Lấy lịch sử điểm uy tín thành công.");
        }
    }
}
