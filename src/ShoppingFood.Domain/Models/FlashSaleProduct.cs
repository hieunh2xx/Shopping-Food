using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class FlashSaleProduct
    {
        public Guid Id { get; set; }
        public Guid FlashSaleId { get; set; }
        public Guid ProductId { get; set; }
        public decimal FlashSalePrice { get; set; }
        public int QuantityLimit { get; set; }
        public int SoldQuantity { get; set; } = 0;
        public FlashSaleProductStatus Status { get; set; } = FlashSaleProductStatus.Pending;
        public string? RejectReason { get; set; } // ghi chú của admin khi từ chối duyệt
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual FlashSale FlashSale { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}
