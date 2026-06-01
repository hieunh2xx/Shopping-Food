using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class ReorderCommandValidator : AbstractValidator<ReorderCommand>
    {
        public ReorderCommandValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull();
        }
    }
}
