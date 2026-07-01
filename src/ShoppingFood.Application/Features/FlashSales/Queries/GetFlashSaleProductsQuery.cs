using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.FlashSales.Queries
{
    public class GetFlashSaleProductsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid FlashSaleId { get; set; }
    }
}
