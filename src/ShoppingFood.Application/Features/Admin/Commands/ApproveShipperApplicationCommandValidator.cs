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

            RuleFor(x => x.RejectionReason)
                .NotEmpty().When(x => !x.IsApproved).WithMessage("{PropertyName} is required.")
                .MaximumLength(500).WithMessage("{PropertyName} must not exceed 500 characters.");

        }
    }
}
