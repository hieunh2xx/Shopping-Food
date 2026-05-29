using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Cart
{
    public class CartDto
    {
        public Guid Id { get; set; }
        public Guid? UserAccountId { get; set; }
        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
        public decimal TotalCartPrice => Items.Sum(i => i.TotalPrice);
    }
}
