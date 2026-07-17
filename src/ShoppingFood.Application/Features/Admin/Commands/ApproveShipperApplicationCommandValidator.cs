using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ApproveShipperApplicationCommandValidator : AbstractValidator<ApproveShipperApplicationCommand>
    {
        public ApproveShipperApplicationCommandValidator()
        {
            RuleFor(x => x.ApplicationId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();

            RuleFor(x => x.Action)
                .NotEmpty().WithMessage("Action is required")
                .Must(a => a == "Approve" || a == "Reject" || a == "NeedsInfo")
                .WithMessage("Action must be 'Approve', 'Reject', or 'NeedsInfo'.");

            RuleFor(x => x.RejectionReason)
                .NotEmpty().When(x => x.Action == "Reject" || x.Action == "NeedsInfo").WithMessage("{PropertyName} is required.")
                .MaximumLength(500).WithMessage("{PropertyName} must not exceed 500 characters.");

        }
    }
}
