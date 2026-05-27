using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Dto.User
{
    public class SellerApplicationStatusDto
    {
        public Guid Id { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string BusinessAddress { get; set; } = string.Empty;
        public string ContactInfo {  get; set; } = string.Empty;
        public string Status {  get; set; } = string.Empty;
        public DateTime? ReviewAt { get; set; }
        public string? RejectionReason {  get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdateAt { get; set; }
    }
}
