using ShoppingFood.Application.Interfaces;

namespace ShoppingFood.API.Workers
{
    /// <summary>
    /// Định kỳ đồng bộ giao dịch SePay qua API khi webhook miss (server tắt, ngrok 502).
    /// </summary>
    public class SepayReconciliationWorker : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(2);
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SepayReconciliationWorker> _logger;

        public SepayReconciliationWorker(IServiceProvider serviceProvider, ILogger<SepayReconciliationWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var orchestration = scope.ServiceProvider.GetRequiredService<IPaymentOrchestrationService>();
                    var confirmed = await orchestration.ReconcileAllPendingSepaySessionsAsync(stoppingToken);
                    if (confirmed > 0)
                    {
                        _logger.LogInformation("SePay reconciliation confirmed {Count} payment(s) via API", confirmed);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "SePay reconciliation worker error");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }
    }
}
