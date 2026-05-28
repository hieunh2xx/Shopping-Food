using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Restaurants.Commands
{
    public class UpdateRestaurantShippingFeeCommandValidator : AbstractValidator<UpdateRestaurantShippingFeeCommand>
    {
        public UpdateRestaurantShippingFeeCommandValidator()
        {
            RuleFor(p => p.ShippingFee)
                .GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be greater than or equal to 0.");
        }
    }
}
