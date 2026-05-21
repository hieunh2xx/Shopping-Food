using MediatR;
using ShoppingFood.Core.Base;
using System.Collections.Generic;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetCategoriesQuery : IRequest<ApiResponse>
    {
    }
}
