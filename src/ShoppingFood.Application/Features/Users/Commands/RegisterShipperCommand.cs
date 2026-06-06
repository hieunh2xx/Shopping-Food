using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class RegisterShipperCommand : BaseCommand, IRequest<ApiResponse>
    {
        public string UserName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Phone {  get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty; 
        public string IdentityCardNumber { get; set;  } = string.Empty;
        public string IdentityCardFrontUrl { get; set; } = string.Empty;
        public string IdentityCardBackUrl { get; set; } = string.Empty;
        public VehicleType VehicleType { get; set; }
        public string VehiclePlateNumber { get; set; } = string.Empty;
        public string DriverLicenseUrl { get; set; } = string.Empty;
        public string VehicleRegistrationUrl { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }
}
