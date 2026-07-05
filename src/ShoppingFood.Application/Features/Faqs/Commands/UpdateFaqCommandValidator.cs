using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Faqs.Commands
{
    public class UpdateFaqCommandValidator : AbstractValidator<UpdateFaqCommand>
    {
        public UpdateFaqCommandValidator()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.Question).NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(x => x.Answer).NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
