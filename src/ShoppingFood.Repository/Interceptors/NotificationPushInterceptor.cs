using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Repository.Interceptors
{
    public class NotificationPushInterceptor : SaveChangesInterceptor
    {
        private readonly IServiceProvider _serviceProvider;
        private static readonly ConditionalWeakTable<DbContext, List<Notification>> _addedNotifications = new();

        public NotificationPushInterceptor(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            Console.WriteLine("[NotificationPushInterceptor] SavingChangesAsync CALLED!");
            
            if (eventData.Context == null) return base.SavingChangesAsync(eventData, result, cancellationToken);

            var allAdded = eventData.Context.ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added)
                .ToList();

            Console.WriteLine($"[NotificationPushInterceptor] Total Added entities: {allAdded.Count}");
            foreach (var e in allAdded)
            {
                Console.WriteLine($"[NotificationPushInterceptor] Added entity type: {e.Entity.GetType().Name}");
            }

            var added = allAdded
                .Where(e => e.Entity is Notification)
                .Select(e => (Notification)e.Entity)
                .ToList();

            if (added.Any())
            {
                _addedNotifications.AddOrUpdate(eventData.Context, added);
            }

            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        public override async ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
        {
            Console.WriteLine("[NotificationPushInterceptor] SavedChangesAsync CALLED!");
            var res = await base.SavedChangesAsync(eventData, result, cancellationToken);

            if (eventData.Context != null && _addedNotifications.TryGetValue(eventData.Context, out var notificationsToPush))
            {
                _addedNotifications.Remove(eventData.Context);

                using var scope = _serviceProvider.CreateScope();
                var pushService = scope.ServiceProvider.GetRequiredService<INotificationPushService>();

                foreach (var n in notificationsToPush)
                {
                    var payload = new
                    {
                        id = n.Id,
                        title = n.Title,
                        message = n.Message,
                        notificationType = n.NotificationType.ToString(),
                        targetId = n.TargetId,
                        isRead = n.IsRead,
                        createAt = n.CreateAt.ToString("o")
                    };

                    try
                    {
                        Console.WriteLine($"[NotificationPushInterceptor] Pushing to user {n.UserId}. Message: {n.Message}");
                        await pushService.PushToUserAsync(n.UserId, payload, cancellationToken);
                        Console.WriteLine($"[NotificationPushInterceptor] Push successful to {n.UserId}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[NotificationPushInterceptor] ERROR pushing: {ex.Message}");
                    }
                }
            }

            return res;
        }
    }
}
