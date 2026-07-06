using MediatR;
using ShoppingFood.Dto.System;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateMaintenanceSettingsCommand : IRequest<ApiResponse>
    {
        public bool IsMaintenanceMode { get; set; }
        public DateTime? ScheduledStartTime { get; set; }
        public string? NotificationTitle { get; set; }
        public string? NotificationBody { get; set; }
    }
}
