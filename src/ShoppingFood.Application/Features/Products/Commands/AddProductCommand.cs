using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Product;
namespace ShoppingFood.Application.Features.Products.Commands
{
    public class AddProductCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid RestaurantId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public Guid CategoryId { get; set; }
        public StockStatus StockStatus { get; set; } = StockStatus.InStock;
        public List<string>? ImageUrls { get; set; }
        public List<Guid>? ToppingIds { get; set; }
        public List<ProductSizeDto>? Sizes { get; set; }
    }
}
