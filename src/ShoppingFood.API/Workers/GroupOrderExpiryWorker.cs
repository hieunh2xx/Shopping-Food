using MediatR;
using ShoppingFood.Application.Features.GroupOrders;

namespace ShoppingFood.API.Workers
{
    /// <summary>
    /// Hủy các phòng gom đơn quá hạn chưa chốt và hoàn tiền đã trả trước về ví thành viên.
    /// </summary>
    public class GroupOrderExpiryWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<GroupOrderExpiryWorker> _logger;

        public GroupOrderExpiryWorker(IServiceProvider serviceProvider, ILogger<GroupOrderExpiryWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                    var expired = await mediator.Send(new ExpireGroupOrdersCommand(), stoppingToken);
                    if (expired > 0)
                        _logger.LogInformation("Expired {Count} group orders", expired);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Group order expiry worker error");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
