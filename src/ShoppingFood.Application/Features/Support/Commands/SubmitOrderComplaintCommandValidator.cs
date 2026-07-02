using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Support.Commands
{
    public class SubmitOrderComplaintCommandValidator : AbstractValidator<SubmitOrderComplaintCommand>
    {
        public SubmitOrderComplaintCommandValidator()
        {
            RuleFor(x => x.OrderId).NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.Reason).NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(200).WithMessage("{PropertyName} must not exceed 200 characters.");

            RuleFor(x => x.Description).MaximumLength(1000).WithMessage("{PropertyName} must not exceed 1000 characters.")
                .When(x => x.Description != null);

            RuleFor(x => x.EvidenceImageUrl).NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");
        }
    }
}
