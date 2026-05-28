using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class UpdateRestaurantStatusCommand : BaseCommand, IRequest<ApiResponse>
    {
        public bool IsTemporarilyClosed { get; set; }
    }
}
