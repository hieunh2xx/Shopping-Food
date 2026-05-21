using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShoppingFood.Domain.Enums;
namespace ShoppingFood.Application.Features.Products.Commands
{
    public class AddProductCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid RestaurantId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public StockStatus StockStatus { get; set; } = StockStatus.InStock;
        public List<string>? ImageUrls { get; set; }
    }
}
