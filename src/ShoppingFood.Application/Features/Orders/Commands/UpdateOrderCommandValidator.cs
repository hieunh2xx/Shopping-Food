using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class UpdateOrderCommandValidator : AbstractValidator<UpdateOrderCommand>
    {
        public UpdateOrderCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
            RuleFor(x => x.DeliveryAddress)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
            RuleFor(x => x.ContactName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
            RuleFor(x => x.ContactPhone)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull()
                .Matches(@"^\d{9,15}$").WithMessage("Phone number must contain 9 to 15 digits.");
        }
    }
}
