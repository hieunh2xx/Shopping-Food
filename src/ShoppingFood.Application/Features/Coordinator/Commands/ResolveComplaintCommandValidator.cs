using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ResolveComplaintCommandValidator : AbstractValidator<ResolveComplaintCommand>
    {
        private static readonly string[] ValidResolutionTypes = { "SellerFault", "ShipperFault", "NoFault" };
        public ResolveComplaintCommandValidator()
        {
            
            RuleFor(x => x.ReportId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.ResolutionType)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Must(r => ValidResolutionTypes.Contains(r))
                .WithMessage("{PropertyName} must be: SellerFault, ShipperFault, or NoFault.");

            RuleFor(x => x.Notes)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(1000).WithMessage("{PropertyName} must not exceed 1000 characters.");

            RuleFor(x => x.PenaltyScore)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.")
                .When(x => x.ResolutionType == "ShipperFault");
        }
    }
}
