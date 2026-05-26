using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.Toppings.Queries
{
    public class GetRestaurantToppingsQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid RestaurantId { get; set; }
        public GetRestaurantToppingsQuery(Guid restaurantId)
        {
            RestaurantId = restaurantId;
        }
    }
}
