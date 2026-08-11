using System;

namespace ShoppingFood.Domain.Models
{
    public class CartItem
    {
        public Guid Id { get; set; }
        public Guid CartId { get; set; }
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal PriceAtAdded { get; set; }
        public decimal ToppingAndSizeSurcharge { get; set; } = 0;
        public string? SelectedSize { get; set; }
        public string? SelectedToppings { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Khuyến mãi Mua X Tặng Y gắn với dòng giỏ (cả món mua và món tặng).</summary>
        public Guid? BuyXGetYPromotionId { get; set; }
        /// <summary>Món tặng (giá 0) thuộc bundle.</summary>
        public bool IsGift { get; set; }
        /// <summary>Trỏ tới dòng món mua (parent) khi đây là món tặng.</summary>
        public Guid? ParentCartItemId { get; set; }

        // Navigation properties
        public virtual Cart Cart { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
        public virtual BuyXGetYPromotion? BuyXGetYPromotion { get; set; }
        public virtual CartItem? ParentCartItem { get; set; }
    }
}
