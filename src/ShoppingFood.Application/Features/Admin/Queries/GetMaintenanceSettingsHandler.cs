using MediatR;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Dto.System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetMaintenanceSettingsHandler : IRequestHandler<GetMaintenanceSettingsQuery, MaintenanceSettingsDto>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;

        public GetMaintenanceSettingsHandler(ISystemConfigRepository systemConfigRepository)
        {
            _systemConfigRepository = systemConfigRepository;
        }

        public async Task<MaintenanceSettingsDto> Handle(GetMaintenanceSettingsQuery request, CancellationToken cancellationToken)
        {
            var configs = await _systemConfigRepository.GetAsync(c => c.Key == "MaintenanceSettings");
            var config = configs.FirstOrDefault();
            if (config != null && !string.IsNullOrEmpty(config.Value))
            {
                var settings = JsonSerializer.Deserialize<MaintenanceSettingsDto>(config.Value);
                if (settings != null)
                {
                    return settings;
                }
            }

            return new MaintenanceSettingsDto
            {
                IsMaintenanceMode = false,
                ScheduledStartTime = null
            };
        }
    }
}
