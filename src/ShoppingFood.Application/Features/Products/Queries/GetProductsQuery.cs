using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetProductsQuery : BaseQuery, IRequest<ApiResponse>
    {
    }
}
