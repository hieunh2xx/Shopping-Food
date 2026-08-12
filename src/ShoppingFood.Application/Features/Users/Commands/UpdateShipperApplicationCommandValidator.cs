using FluentValidation;
using System;
using System.IO;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class UpdateShipperApplicationCommandValidator : AbstractValidator<UpdateShipperApplicationCommand>
    {
        public UpdateShipperApplicationCommandValidator()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("Application Id is required");
            
            RuleFor(x => x.IdentityCardNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.");

            RuleFor(x => x.IdentityCardFrontUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(IsValidImageUrl)
                .WithMessage("{PropertyName} must be a valid image URL.");

            RuleFor(x => x.IdentityCardBackUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(IsValidImageUrl)
                .WithMessage("{PropertyName} must be a valid image URL.");

            RuleFor(x => x.VehicleType)
                .IsInEnum().WithMessage("Invalid vehicle type. Allowed: Motorcycle, ElectricMotorbike, Car.");

            RuleFor(x => x.VehiclePlateNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.");

            RuleFor(x => x.DriverLicenseUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(IsValidImageUrl)
                .WithMessage("{PropertyName} must be a valid image URL.");

            RuleFor(x => x.VehicleRegistrationUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.")
                .Must(IsValidImageUrl)
                .WithMessage("{PropertyName} must be a valid image URL.");
        }

        /// <summary>
        /// Accepts http(s)/relative CDN URLs (Cloudinary/placehold often omit file extension)
        /// or paths that end with a known image extension.
        /// </summary>
        internal static bool IsValidImageUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return false;

            var cleanUrl = url.Split('?')[0].Trim();
            if (cleanUrl.Length == 0) return false;

            var ext = Path.GetExtension(cleanUrl).ToLowerInvariant();
            if (ext is ".jpg" or ".jpeg" or ".png" or ".webp")
                return true;

            // CDN / placeholder URLs without extension
            return cleanUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || cleanUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                || cleanUrl.StartsWith('/');
        }
    }
}
