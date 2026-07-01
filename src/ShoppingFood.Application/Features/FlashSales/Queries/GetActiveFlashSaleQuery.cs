using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.FlashSales.Queries
{
    public class GetActiveFlashSaleQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
