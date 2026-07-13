using FluentValidation;
using System;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ConfirmSelfDeliverySuccessCommandValidator : AbstractValidator<ConfirmSelfDeliverySuccessCommand>
    {
        public ConfirmSelfDeliverySuccessCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("Order ID is required.");
        }
    }
}
