using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;

namespace ShoppingFood.Application.Features.Restaurants.Commands
{
    public class UpdateRestaurantDeliveryConfigCommand : BaseCommand, IRequest<ApiResponse>
    {
        public DeliveryType DeliveryType { get; set; }
        public double? MaxDeliveryRadiusKm { get; set; }
        public double FreeDeliveryRadiusKm { get; set; }
        public decimal FreeShippingMinimumOrder { get; set; }
        public decimal ShippingFee { get; set; }
    }
}
