using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpdateShipperApplicationCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public string IdentityCardNumber { get; set; } = string.Empty;
        public string IdentityCardFrontUrl { get; set; } = string.Empty;
        public string IdentityCardBackUrl { get; set; } = string.Empty;
        public VehicleType VehicleType { get; set; }
        public string VehiclePlateNumber { get; set; } = string.Empty;
        public string DriverLicenseUrl { get; set; } = string.Empty;
        public string VehicleRegistrationUrl { get; set; } = string.Empty;
    }
}
