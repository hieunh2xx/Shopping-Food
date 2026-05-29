using System.Collections.Generic;

namespace ShoppingFood.Dto.User
{
    public class PreAuthResponseDto
    {
        public string PreAuthToken { get; set; } = string.Empty;
        public List<string> AvailableMethods { get; set; } = new List<string>();
        public string Username { get; set; } = string.Empty;
    }
}
