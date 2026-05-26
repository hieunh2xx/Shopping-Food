using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Queries
{
    public class GetGlobalMenuCategoriesQuery : IRequest<ApiResponse>
    {
        public bool ShowHidden { get; set; } = false; // Admin can set this to true
    }
}
