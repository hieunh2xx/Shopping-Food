using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Core.Base;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System;
using System.Linq;
using ShoppingFood.Core.Interfaces;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateMaintenanceSettingsHandler : IRequestHandler<UpdateMaintenanceSettingsCommand, ApiResponse>
    {
        private readonly ISystemConfigRepository _systemConfigRepository;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateMaintenanceSettingsHandler(ISystemConfigRepository systemConfigRepository, IServiceScopeFactory scopeFactory, IUnitOfWork unitOfWork)
        {
            _systemConfigRepository = systemConfigRepository;
            _scopeFactory = scopeFactory;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(UpdateMaintenanceSettingsCommand request, CancellationToken cancellationToken)
        {
            var configs = await _systemConfigRepository.GetAsync(c => c.Key == "MaintenanceSettings");
            var config = configs.FirstOrDefault();
            
            bool wasMaintenanceMode = false;
            if (config != null && !string.IsNullOrEmpty(config.Value))
            {
                var currentSettings = JsonSerializer.Deserialize<ShoppingFood.Dto.System.MaintenanceSettingsDto>(config.Value);
                if (currentSettings != null)
                {
                    wasMaintenanceMode = currentSettings.IsMaintenanceMode;
                }
            }
            
            if (config == null)
            {
                config = new SystemConfig
                {
                    Key = "MaintenanceSettings",
                    Description = "System maintenance settings"
                };
                
                var newSettings = new ShoppingFood.Dto.System.MaintenanceSettingsDto
                {
                    IsMaintenanceMode = request.IsMaintenanceMode,
                    ScheduledStartTime = request.ScheduledStartTime,
                    NotificationTitle = request.NotificationTitle,
                    NotificationBody = request.NotificationBody
                };

                config.Value = JsonSerializer.Serialize(newSettings);
                config.UpdatedAt = DateTime.UtcNow;
                
                _systemConfigRepository.Add(config);
            }
            else
            {
                var newSettings = new ShoppingFood.Dto.System.MaintenanceSettingsDto
                {
                    IsMaintenanceMode = request.IsMaintenanceMode,
                    ScheduledStartTime = request.ScheduledStartTime,
                    NotificationTitle = request.NotificationTitle,
                    NotificationBody = request.NotificationBody
                };

                config.Value = JsonSerializer.Serialize(newSettings);
                config.UpdatedAt = DateTime.UtcNow;
                
                _systemConfigRepository.Update(config);
            }

            await _unitOfWork.SaveChangesAsync();

            // Trigger background task for emails and notifications
            Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ShoppingFoodContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<ShoppingFood.Repository.Interfaces.IEmailService>();

                var users = await dbContext.Users.Where(u => u.Status == UserStatus.Active).Select(u => new { u.Id, u.Email }).ToListAsync();
                
                string title = request.NotificationTitle ?? "Thông báo hệ thống";
                string body = request.NotificationBody ?? "";
                
                if (request.ScheduledStartTime.HasValue && !request.IsMaintenanceMode)
                {
                    // Hẹn giờ bảo trì (In-app và Email)
                    if (string.IsNullOrEmpty(body))
                    {
                        var vnTime = request.ScheduledStartTime.Value.Kind == DateTimeKind.Utc
                            ? request.ScheduledStartTime.Value.AddHours(7)
                            : request.ScheduledStartTime.Value;
                        body = $"Hệ thống sẽ bảo trì vào lúc {vnTime:dd/MM/yyyy HH:mm} (giờ Việt Nam). Vui lòng hoàn tất giao dịch trước thời gian này.";
                    } 
                    foreach (var u in users)
                    {
                        if (!string.IsNullOrEmpty(u.Email))
                            await emailService.SendEmailAsync(u.Email, title, body);
                        
                        var notif = new Notification
                        {
                            Id = Guid.NewGuid(),
                            UserId = u.Id,
                            Title = title,
                            Message = body,
                            CreateAt = DateTime.UtcNow,
                            IsRead = false,
                            NotificationType = NotificationType.System
                        };
                        dbContext.Notifications.Add(notif);
                    }
                    await dbContext.SaveChangesAsync();
                }
                else if (request.IsMaintenanceMode && !wasMaintenanceMode)
                {
                    // Bật bảo trì ngay lập tức
                    if (string.IsNullOrEmpty(body)) 
                        body = "Hệ thống đang được bảo trì khẩn cấp. Chúng tôi sẽ sớm hoạt động trở lại.";
                        
                    foreach (var u in users)
                    {
                        if (!string.IsNullOrEmpty(u.Email))
                            await emailService.SendEmailAsync(u.Email, title, body);
                    }
                }
                else if (!request.IsMaintenanceMode && wasMaintenanceMode)
                {
                    // Tắt bảo trì
                    if (string.IsNullOrEmpty(body)) 
                        body = "Hệ thống đã hoàn tất bảo trì và hoạt động bình thường trở lại.";
                        
                    foreach (var u in users)
                    {
                        if (!string.IsNullOrEmpty(u.Email))
                            await emailService.SendEmailAsync(u.Email, title, body);
                    }
                }
            });

            return ApiResponse.Success("Cập nhật cài đặt bảo trì thành công.");
        }
    }
}
