using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Queries
{
    public interface IGetCustomerLoyaltyPointsHandler
    {
        Task<ApiResponse> Handle(GetCustomerLoyaltyPointsQuery request, CancellationToken cancellationToken);
    }
}