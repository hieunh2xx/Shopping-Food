using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetProposedDeliveryOfferQueryValidator : AbstractValidator<GetProposedDeliveryOfferQuery>
    {
        public GetProposedDeliveryOfferQueryValidator()
        {
            RuleFor(x => x.OrderId)
                .NotEmpty().WithMessage("{PropertyName is required.}")
                .NotNull();
        }
    }
}
