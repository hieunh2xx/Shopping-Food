using System;

namespace ShoppingFood.Dto.System
{
    public class MaintenanceSettingsDto
    {
        public bool IsMaintenanceMode { get; set; }
        public DateTime? ScheduledStartTime { get; set; }
        public string? NotificationTitle { get; set; }
        public string? NotificationBody { get; set; }
    }
}
