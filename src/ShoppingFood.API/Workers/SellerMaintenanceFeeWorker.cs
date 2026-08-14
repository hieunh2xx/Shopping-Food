using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;

namespace ShoppingFood.API.Workers
{
    /// <summary>Thu phí duy trì nhà hàng hàng tháng (config SellerMaintenanceFee).</summary>
    public class SellerMaintenanceFeeWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public SellerMaintenanceFeeWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Chạy lần đầu sau 1 phút khởi động, sau đó mỗi 24h
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentSettlementService>();
                    var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                    await paymentService.ProcessDueMaintenanceFeesAsync();
                    await unitOfWork.SaveChangesAsync();
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    await LogErrorToDatabaseAsync("SellerMaintenanceFeeWorker.ExecuteAsync", ex);
                }

                try
                {
                    await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private async Task LogErrorToDatabaseAsync(string action, Exception ex)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                await unitOfWork.LogErrorAsync(action, ex);
            }
            catch
            {
                // ignore
            }
        }
    }
}
