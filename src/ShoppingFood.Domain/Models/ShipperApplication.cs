using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class ShipperApplication
    {
        public Guid Id { get; set;}
        public Guid UserProfileId { get; set;}
        public string IdentityCardNumber { get; set;} = string.Empty;
        public string IdentityCardFrontUrl { get; set;} = string.Empty;
        public string IdentityCardBackUrl { get; set;} = string.Empty;
        public VehicleType VehicleType { get; set;}
        public string VehiclePlateNumber { get; set;} = string.Empty;
        public string DriverLicenseUrl { get; set;} = string.Empty;
        public string VehicleRegistrationUrl { get; set;} = string.Empty;
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;
        public Guid? ReviewedBy { get; set;}
        public DateTime? ReviewedAt { get; set;}
        public string? RejectionReason { get; set;} = string.Empty;

        public DateTime CreatedAt { get; set;} = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set;} = DateTime.UtcNow;

        public virtual UserProfile UserProfile { get; set; } = null!;
        public virtual UserProfile? Reviewer { get; set; }
    }
}
