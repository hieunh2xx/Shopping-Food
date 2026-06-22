using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Promotions.Queries
{
    public class GetPromotionsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public bool? IsActive { get; set; }
        public Guid? RestaurantId { get; internal set; }
    }
}
