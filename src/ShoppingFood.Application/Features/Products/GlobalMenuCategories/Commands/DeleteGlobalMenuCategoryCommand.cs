using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands
{
    public class DeleteGlobalMenuCategoryCommand : IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
    }
}
