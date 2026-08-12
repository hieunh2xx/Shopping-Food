using MediatR;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateDeliverySettingsHandler : IRequestHandler<UpdateDeliverySettingsCommand, bool>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateDeliverySettingsHandler(ISystemConfigRepository systemConfigRepository, IUnitOfWork unitOfWork)
        {
            _systemConfigRepository = systemConfigRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(UpdateDeliverySettingsCommand request, CancellationToken cancellationToken)
        {
            var configs = await _systemConfigRepository.GetAsync(c => c.Key == "DeliverySettings");
            var config = configs.FirstOrDefault();

            var settingsDto = new DeliverySettingsDto
            {
                MaxDeliveryRadiusKm = request.MaxDeliveryRadiusKm,
                FreeDeliveryRadiusKm = request.FreeDeliveryRadiusKm,
                FreeShippingMinimumOrder = request.FreeShippingMinimumOrder,
                ShippingFee = request.ShippingFee
            };

            var serializedSettings = JsonSerializer.Serialize(settingsDto, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (config == null)
            {
                config = new SystemConfig
                {
                    Key = "DeliverySettings",
                    Value = serializedSettings,
                    Description = "Cấu hình phí giao hàng của nền tảng (Platform Delivery)"
                };
                _systemConfigRepository.Add(config);
            }
            else
            {
                config.Value = serializedSettings;
                _systemConfigRepository.Update(config);
            }

            await _unitOfWork.SaveChangesAsync();

            return true;
        }
    }
}
