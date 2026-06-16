using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class SuspendShipperCommandValidator : AbstractValidator<SuspendShipperCommand>
    {
        public SuspendShipperCommandValidator()
        {
            RuleFor(x => x.ShipperId).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.DurationMinutes).GreaterThan(0).WithMessage("DurationMinutes must be greater than 0.");
            RuleFor(x => x.Reason).NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
