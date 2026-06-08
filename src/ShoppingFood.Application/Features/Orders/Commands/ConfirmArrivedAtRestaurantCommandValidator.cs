using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmArrivedAtRestaurantCommandValidator : AbstractValidator<ConfirmArrivedAtRestaurantCommand>
    {
        public ConfirmArrivedAtRestaurantCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90.0, 90.0).WithMessage("{PropertyName} must be between -90 to 90.");
              
            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180.0, 180.0).WithMessage("{PropertyName} must be between -180 to 180");              
        }
    }
}
