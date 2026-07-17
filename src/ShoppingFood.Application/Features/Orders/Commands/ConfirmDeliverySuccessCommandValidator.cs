using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmDeliverySuccessCommandValidator : AbstractValidator<ConfirmDeliverySuccessCommand>
    {
        public ConfirmDeliverySuccessCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90.0, 90.0).WithMessage("Latitude must be between -90 and 90.");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180.0, 180.0).WithMessage("Longitude must be between -180 and 180.");

            RuleFor(x => x.DeliveryProofImageUrl)
                .NotEmpty().WithMessage("Delivery proof image is required.")
                .Must(url => HasValidImageExtension(url))
                .WithMessage("Delivery proof image must be a valid image file (.jpg, .jpeg, .png, .webp).");
        }

        private bool HasValidImageExtension(string url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            var cleanUrl = url.Split('?')[0];
            var ext = Path.GetExtension(cleanUrl).ToLower();
            return ext is ".jpg" or ".jpeg" or ".png" or ".webp";
        }
    }
}
