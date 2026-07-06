using ShoppingFood.Application.Interfaces;

namespace ShoppingFood.API.Workers
{
    /// <summary>
    /// Đóng phiên QR quá 10 phút — từ chối thanh toán trễ.
    /// </summary>
    public class PaymentExpiryWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PaymentExpiryWorker> _logger;

        public PaymentExpiryWorker(IServiceProvider serviceProvider, ILogger<PaymentExpiryWorker> logger)
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
                    var orchestration = scope.ServiceProvider.GetRequiredService<IPaymentOrchestrationService>();
                    await orchestration.ExpireStaleSessionsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Payment expiry worker error");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
