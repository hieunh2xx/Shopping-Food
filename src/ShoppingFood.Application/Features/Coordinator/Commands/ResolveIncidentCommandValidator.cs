using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class ResolveIncidentCommandValidator : AbstractValidator<ResolveIncidentCommand>
    {
        public ResolveIncidentCommandValidator()
        {
            RuleFor(x => x.OrderId).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.ResolutionType)
                .Must(x => x == "CustomerFault" || x == "ShipperFault" || x == "ForceCancelNoPenalty")
                .WithMessage("{PropertyName} must be CustomerFault, ShipperFault, or ForceCancelNoPenalty.");
            RuleFor(x => x.Notes).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.PenaltyScore).GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be greater than or equal to 0.");
        }
    }
}
