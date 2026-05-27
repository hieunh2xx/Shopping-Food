using MediatR;
using ShoppingFood.Core.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Restaurants.Queries
{
    public class GetRestaurantDetailQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid Id {  get; set; }
        public GetRestaurantDetailQuery(Guid id)
        {
            Id = id;
        }
    }
}
