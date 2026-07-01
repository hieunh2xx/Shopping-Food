using System;
using System.Collections.Generic;

namespace ShoppingFood.Dto.FlashSale
{
    public class ActiveFlashSaleDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<FlashSaleProductItemDto> Products { get; set; } = new();
    }
}
