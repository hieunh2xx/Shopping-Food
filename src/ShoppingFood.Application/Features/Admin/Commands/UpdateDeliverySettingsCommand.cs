using MediatR;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateDeliverySettingsCommand : IRequest<bool>
    {
        public double? MaxDeliveryRadiusKm { get; set; }
        public double FreeDeliveryRadiusKm { get; set; }
        public decimal FreeShippingMinimumOrder { get; set; }
        public decimal ShippingFee { get; set; }
        public double IncludedKmInBaseFee { get; set; } = 5.0;
    }
}
