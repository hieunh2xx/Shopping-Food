using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.Toppings.Commands
{
    public class UpdateToppingCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string ToppingName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
    }
}
