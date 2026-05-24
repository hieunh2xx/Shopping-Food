using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin
{
    public class ApproveApplicationCommandValidator : AbstractValidator<ApproveApplicationCommand>
    {
        public ApproveApplicationCommandValidator()
        {
            RuleFor(r => r.ApplicationId)
                .NotEmpty().WithMessage("{PropertyName is required}")
                .NotNull();
            RuleFor(r => r.RejectionReason)
                .NotEmpty().WithMessage("{PropertyName} is required")
                .NotNull()
                .MaximumLength(500).WithMessage("{PropertyName} must not exceed 500 characters.")
                .When(r => !r.IsApproved);
        }
    }
}
