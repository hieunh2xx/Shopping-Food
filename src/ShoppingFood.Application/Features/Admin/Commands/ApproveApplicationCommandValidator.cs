using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ApproveApplicationCommandValidator : AbstractValidator<ApproveApplicationCommand>
    {
        public ApproveApplicationCommandValidator()
        {
            RuleFor(r => r.ApplicationId)
                .NotEmpty().WithMessage("{PropertyName is required}")
                .NotNull();
            RuleFor(r => r.Action)
                .NotEmpty().WithMessage("Action is required")
                .Must(a => a == "Approve" || a == "Reject" || a == "NeedsInfo")
                .WithMessage("Action must be 'Approve', 'Reject', or 'NeedsInfo'.");

            RuleFor(r => r.RejectionReason)
                .NotEmpty().WithMessage("Reason is required when rejecting or requesting info")
                .NotNull()
                .MaximumLength(500).WithMessage("{PropertyName} must not exceed 500 characters.")
                .When(r => r.Action == "Reject" || r.Action == "NeedsInfo");
        }
    }
}
