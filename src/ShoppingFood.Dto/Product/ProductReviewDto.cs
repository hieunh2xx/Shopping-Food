using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.Product
{
    public class ProductReviewDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public Guid UserProfileId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? SellerReply { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
