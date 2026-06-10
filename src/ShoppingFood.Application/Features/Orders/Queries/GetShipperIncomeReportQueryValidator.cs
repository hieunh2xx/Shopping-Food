using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Queries
{
    public class GetShipperIncomeReportQueryValidator : AbstractValidator<GetShipperIncomeReportQuery>
    {
        public GetShipperIncomeReportQueryValidator()
        {
            RuleFor(x => x.StartDate)
                .LessThanOrEqualTo(x => x.EndDate ?? DateTime.UtcNow)
                .WithMessage("Start date must be less than or equal to end date.")
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue);
        }
    }
}
