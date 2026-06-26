using System;

namespace ShoppingFood.Dto.Restaurant
{
    public class RestaurantBestSellerDto
    {
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Revenue { get; set; }
    }
}
