using ShoppingFood.Dto.Product;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Restaurant
{
    public class RestaurantProfileDto
    {
        public Guid Id { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone {  get; set; } = string.Empty;
        public string Email {  get; set; } = string.Empty;
        public string? LogoUrl {  get; set; }
        public string Status {  get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<ProductDto> Products { get; set; } = new List<ProductDto>();
    }
}
