using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ReleaseOrderCommandValidator : AbstractValidator<ReleaseOrderCommand>
    {
        public ReleaseOrderCommandValidator()
        {
            RuleFor(x => x.OrderId).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.Reason).NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
