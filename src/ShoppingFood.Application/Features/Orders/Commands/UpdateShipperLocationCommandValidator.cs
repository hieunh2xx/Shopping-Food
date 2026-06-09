using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class UpdateShipperLocationCommandValidator : AbstractValidator<UpdateShipperLocationCommand>
    {
        public UpdateShipperLocationCommandValidator()
        {
            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90.0, 90.0).WithMessage("Latitude must be between -90 and 90.");
            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180.0, 180.0).WithMessage("Longitude must be between -180 and 180.");
        }
    }
}
