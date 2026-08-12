using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class ApplyShipperCommandValidator : AbstractValidator<ApplyShipperCommand                               >
    {
        public ApplyShipperCommandValidator()
        {
            RuleFor(x => x.IdentityCardNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.");

            RuleFor(x => x.IdentityCardFrontUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(UpdateShipperApplicationCommandValidator.IsValidImageUrl)
                .WithMessage("{PropertyName} must be a valid image URL.");

            RuleFor(x => x.IdentityCardBackUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(UpdateShipperApplicationCommandValidator.IsValidImageUrl)
                .WithMessage("{PropertyName} must be a valid image URL.");

            RuleFor(x => x.VehicleType)
                .IsInEnum().WithMessage("Invalid vehicle type. Allowed: Motorcycle, ElectricMotorbike, Car.");

            RuleFor(x => x.VehiclePlateNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.");

            RuleFor(x => x.DriverLicenseUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(UpdateShipperApplicationCommandValidator.IsValidImageUrl)
                .WithMessage("{PropertyName} must be a valid image URL.");

            RuleFor(x => x.VehicleRegistrationUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(UpdateShipperApplicationCommandValidator.IsValidImageUrl)
                .WithMessage("{PropertyName} must be a valid image URL.");
        }
    }
}
