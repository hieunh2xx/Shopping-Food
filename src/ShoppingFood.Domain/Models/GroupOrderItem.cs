using System;

namespace ShoppingFood.Domain.Models
{
    public class GroupOrderItem
    {
        public Guid Id { get; set; }
        public Guid GroupOrderMemberId { get; set; }
        public Guid ProductId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int Quantity { get; set; } = 1;
        /// <summary>Đơn giá đã gồm size và topping.</summary>
        public decimal UnitPrice { get; set; }
        public string? SelectedSize { get; set; }
        public string? SelectedToppings { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual GroupOrderMember Member { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}
