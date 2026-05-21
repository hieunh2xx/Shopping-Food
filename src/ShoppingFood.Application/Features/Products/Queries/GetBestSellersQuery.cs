using System.Collections.Generic;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Product;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetBestSellersQuery : IRequest<ApiResponse>
    {
        public int Take { get; set; } = 10;
    }
}
