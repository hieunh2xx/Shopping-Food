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
        public ResolveComplaintCommandValidator()
        {
            
            RuleFor(x => x.ReportId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.ResolutionType)
                .IsInEnum().WithMessage("{PropertyName} must be a valid resolution type.");

            RuleFor(x => x.Notes)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(1000).WithMessage("{PropertyName} must not exceed 1000 characters.");

            RuleFor(x => x.PenaltyScore)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.")
                .When(x => x.ResolutionType == ShoppingFood.Domain.Enums.ComplaintResolutionType.ShipperFault);

            RuleFor(x => x.RefundAmount)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.")
                .When(x => x.ResolutionType == ShoppingFood.Domain.Enums.ComplaintResolutionType.CompensateCustomer);

            RuleFor(x => x.RefundAmount)
                .GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be greater than or equal to 0.");

            RuleFor(x => x.DeductionAmount)
                .GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be greater than or equal to 0.");

            RuleFor(x => x.ResponsibleParty)
                .NotEmpty().WithMessage("{PropertyName} is required when compensating customer.")
                .When(x => x.ResolutionType == ShoppingFood.Domain.Enums.ComplaintResolutionType.CompensateCustomer);
        }
    }
}
