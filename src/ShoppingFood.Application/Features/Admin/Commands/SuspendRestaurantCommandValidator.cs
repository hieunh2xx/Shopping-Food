using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class SuspendRestaurantCommandValidator : AbstractValidator<SuspendRestaurantCommand>
    {
        public SuspendRestaurantCommandValidator()
        {
            RuleFor(x => x.RestaurantId).NotEmpty().WithMessage("{PropertyName} is required.");
            
        }
    }
}
