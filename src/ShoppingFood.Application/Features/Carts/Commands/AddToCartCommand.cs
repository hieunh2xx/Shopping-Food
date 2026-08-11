using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Carts.Commands
{
    public class AddToCartCommand : BaseCommand, IRequest<ApiResponse> 
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public Guid? GuestUserId { get; set; }
        public bool ClearCartIfConflict { get; set; } = false;
        public string? SelectedSize { get; set; }
        public List<string>? SelectedToppings { get; set; }
        /// <summary>Nếu có: thêm bundle Mua X Tặng Y (Quantity = số suất khuyến mãi).</summary>
        public Guid? BuyXGetYPromotionId { get; set; }
    }
}
