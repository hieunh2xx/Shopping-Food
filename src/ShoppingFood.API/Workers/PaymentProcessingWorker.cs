using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Models;

namespace ShoppingFood.API.Workers
{
    /// <summary>
    /// Consumes payment confirmation queue — xử lý thanh toán trên backend, không phụ thuộc request HTTP.
    /// </summary>
    public class PaymentProcessingWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PaymentProcessingWorker> _logger;

        public PaymentProcessingWorker(IServiceProvider serviceProvider, ILogger<PaymentProcessingWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using (var bootScope = _serviceProvider.CreateScope())
            {
                var orchestration = bootScope.ServiceProvider.GetRequiredService<IPaymentOrchestrationService>();
                await orchestration.ReplayUnprocessedWebhooksAsync();
                var reconciled = await orchestration.ReconcileAllPendingSepaySessionsAsync();
                if (reconciled > 0)
                {
                    _logger.LogInformation("Startup SePay reconciliation confirmed {Count} payment(s)", reconciled);
                }
            }

            var queue = _serviceProvider.GetRequiredService<IPaymentMessageQueue>();

            await foreach (var message in queue.ReadAllAsync(stoppingToken))
            {
                try
                {
                    using var msgScope = _serviceProvider.CreateScope();
                    var processor = msgScope.ServiceProvider.GetRequiredService<IPaymentOrchestrationService>();
                    var ok = await processor.ProcessConfirmationAsync(message);
                    _logger.LogInformation(
                        "Payment queue processed {Invoice} source={Source} success={Ok}",
                        message.InvoiceNumber, message.Source, ok);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Payment queue error for {Invoice}", message.InvoiceNumber);
                }
            }
        }
    }
}
