using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Domain.Models
{
    public class ShipperProfile
    {
        public Guid Id { get; set; }
        public Guid UserProfileId { get; set; }
        public Guid ShipperApplicationId { get; set; }
        public VehicleType VehicleType { get; set; }
        public string VehiclePlateNumber { get; set; } = string.Empty;
        public bool IsOnline { get; set; } = false;
        public UserStatus Status { get; set; } = UserStatus.Active;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public decimal WalletBalance { get; set; } = 0;
        public decimal CodCollectedAmount { get; set; } = 0;
        public decimal DebtLimit { get; set; } = 5_000_000m;
        public double ReputationScore { get; set; } = 100;
        public double Rating { get; set; } = 5.0;
        public double? OperatingLatitude { get; set; }
        public double? OperatingLongitude { get; set; }
        public double? OperatingRadiusKm { get; set; }
        public string? WorkingSchedule { get; set; }
        public DateTime? SuspendedUntil { get; set; }
        public string? SuspendedReason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual UserProfile UserProfile { get; set; } = null!;
        public virtual ShipperApplication ShipperApplication { get; set; } = null!;
    }
}
