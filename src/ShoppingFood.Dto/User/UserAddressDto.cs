using System;

namespace ShoppingFood.Dto.User
{
    public class UserAddressDto
    {
        public Guid Id { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
