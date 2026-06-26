using System;
using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Products.MenuCategories.Queries
{
    public class GetMenuCategoriesQuery : IRequest<ApiResponse>
    {
        public Guid RestaurantId { get; set; }
    }
}
