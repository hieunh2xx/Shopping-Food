using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ForceAssignCommandValidator : AbstractValidator<ForceAssignCommand>
    {
        public ForceAssignCommandValidator()
        {
            RuleFor(x => x.OrderId).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.ShipperId).NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
