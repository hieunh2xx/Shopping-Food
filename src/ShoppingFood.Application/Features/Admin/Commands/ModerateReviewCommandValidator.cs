using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ModerateReviewCommandValidator : AbstractValidator<ModerateReviewCommand>
    {
        public ModerateReviewCommandValidator()
        {
            RuleFor(x => x.ReportId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.AdminNote)
                .MaximumLength(500).WithMessage("{PropertyName} must not exceed 500 characters.")
                .When(x => x.AdminNote != null);
        }
    }
}
