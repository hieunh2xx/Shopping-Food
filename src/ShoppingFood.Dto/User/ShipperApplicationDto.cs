using System;

namespace ShoppingFood.Dto.User
{
    public class ShipperApplicationDto
    {
        public Guid Id { get; set; }
        public Guid UserProfileId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string IdentityCardNumber { get; set; } = string.Empty;
        public string IdentityCardFrontUrl { get; set; } = string.Empty;
        public string IdentityCardBackUrl { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string VehiclePlateNumber { get; set; } = string.Empty;
        public string DriverLicenseUrl { get; set; } = string.Empty;
        public string VehicleRegistrationUrl { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? ReviewedAt { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
