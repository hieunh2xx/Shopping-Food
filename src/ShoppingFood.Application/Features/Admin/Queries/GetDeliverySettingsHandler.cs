using MediatR;
using ShoppingFood.Domain.Context;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Dto.System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetDeliverySettingsHandler : IRequestHandler<GetDeliverySettingsQuery, DeliverySettingsDto>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;
        private readonly ShoppingFoodContext _dbContext;

        public GetDeliverySettingsHandler(
            ISystemConfigRepository systemConfigRepository,
            ShoppingFoodContext dbContext)
        {
            _systemConfigRepository = systemConfigRepository;
            _dbContext = dbContext;
        }

        public async Task<DeliverySettingsDto> Handle(GetDeliverySettingsQuery request, CancellationToken cancellationToken)
        {
            var settings = new DeliverySettingsDto
            {
                FreeDeliveryRadiusKm = 3.0,
                FreeShippingMinimumOrder = 0,
                ShippingFee = 0 // chưa có config → 0, không hardcode
            };

            var configs = await _systemConfigRepository.GetAsync(c => c.Key == "DeliverySettings");
            var config = configs.FirstOrDefault();
            if (config != null && !string.IsNullOrEmpty(config.Value))
            {
                var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var parsed = JsonSerializer.Deserialize<DeliverySettingsDto>(config.Value, jsonOpts);
                if (parsed != null)
                {
                    settings.MaxDeliveryRadiusKm = parsed.MaxDeliveryRadiusKm;
                    settings.FreeDeliveryRadiusKm = parsed.FreeDeliveryRadiusKm;
                    settings.FreeShippingMinimumOrder = parsed.FreeShippingMinimumOrder;
                    settings.ShippingFee = parsed.ShippingFee;
                    if (parsed.IncludedKmInBaseFee > 0)
                        settings.IncludedKmInBaseFee = parsed.IncludedKmInBaseFee;
                }
            }

            var finance = await _dbContext.PlatformFinanceConfigs.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
            if (finance != null)
            {
                settings.FeePerKm = finance.FeePerKm > 0 ? finance.FeePerKm : 0m;
                settings.ShipperBaseFee = finance.ShipperBaseFee > 0 ? finance.ShipperBaseFee : 12000m;
                settings.ShipperFeePerKm = finance.ShipperFeePerKm > 0
                    ? finance.ShipperFeePerKm
                    : (finance.FeePerKm > 0 ? finance.FeePerKm : 4000m);
                settings.RushHourMultiplier = finance.RushHourMultiplier > 0 ? finance.RushHourMultiplier : 1.2m;
                settings.RushHourStartTime = finance.RushHourStartTime.ToString(@"hh\:mm");
                settings.RushHourEndTime = finance.RushHourEndTime.ToString(@"hh\:mm");
            }

            return settings;
        }
    }
}
