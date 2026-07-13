using MediatR;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Dto.System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetDeliverySettingsHandler : IRequestHandler<GetDeliverySettingsQuery, DeliverySettingsDto>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;

        public GetDeliverySettingsHandler(ISystemConfigRepository systemConfigRepository)
        {
            _systemConfigRepository = systemConfigRepository;
        }

        public async Task<DeliverySettingsDto> Handle(GetDeliverySettingsQuery request, CancellationToken cancellationToken)
        {
            var configs = await _systemConfigRepository.GetAsync(c => c.Key == "DeliverySettings");
            var config = configs.FirstOrDefault();
            if (config != null && !string.IsNullOrEmpty(config.Value))
            {
                var settings = JsonSerializer.Deserialize<DeliverySettingsDto>(config.Value);
                if (settings != null)
                {
                    return settings;
                }
            }

            return new DeliverySettingsDto
            {
                FreeDeliveryRadiusKm = 3.0,
                FreeShippingMinimumOrder = 0,
                ShippingFee = 15000 // default
            };
        }
    }
}
