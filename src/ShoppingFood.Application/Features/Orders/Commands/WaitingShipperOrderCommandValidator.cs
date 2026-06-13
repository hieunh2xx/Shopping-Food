using FluentValidation;
using System;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class WaitingShipperOrderCommandValidator : AbstractValidator<WaitingShipperOrderCommand>
    {
        public WaitingShipperOrderCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
        }
    }
}
