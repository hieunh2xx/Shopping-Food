using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Queries
{
    public class GetDiscountQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid? RestaurantId { get; set; }
        public decimal? CartAmount { get; set; }
        public bool IncludeAll { get; set; } = false;
    }
}
