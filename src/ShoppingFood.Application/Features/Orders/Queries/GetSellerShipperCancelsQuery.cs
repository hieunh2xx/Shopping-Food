using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetSellerShipperCancelsQuery : BaseQuery, IRequest<ApiResponse>
    {
        /// <summary>Số ngày gần đây (mặc định 30).</summary>
        public int Days { get; set; } = 30;
    }
}
