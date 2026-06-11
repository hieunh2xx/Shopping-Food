using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class OrderDeliveryProposal
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Guid ShipperId { get; set; }
        public ProposalStatus Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiredAt { get; set; }

        public virtual Order Order { get; set; } = null!;
        public virtual ShipperProfile Shipper { get; set; } = null!;
    }
}
