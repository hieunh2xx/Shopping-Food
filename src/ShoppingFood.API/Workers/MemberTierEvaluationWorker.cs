using MediatR;
using ShoppingFood.Application.Features.LoyaltyPoints.Commands;
using ShoppingFood.Core.Interfaces;

namespace ShoppingFood.API.Workers
{
    public class MemberTierEvaluationWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public MemberTierEvaluationWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var nextRun = new DateTime(DateTime.UtcNow.Year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                var delay = nextRun - DateTime.UtcNow;

                try
                {
                    await Task.Delay(delay, stoppingToken);
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                        var response = await mediator.Send(new EvaluateMemberTiersCommand(), stoppingToken);

                        if (response.Error)
                        {
                            
                            var businessException = new Exception($"Member tier evaluation failed: {response.Message}");
                            await LogErrorToDatabaseAsync("MemberTierEvaluationWorker.ExecuteAsync", businessException);
                        }
                    }
                }
                catch (OperationCanceledException)
                {

                }
                catch (Exception ex)
                {
                    await LogErrorToDatabaseAsync("MemberTierEvaluationWorker.ExecuteAsync", ex);
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                } 
            }
        }
        private async Task LogErrorToDatabaseAsync(string action, Exception ex)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var unitOfWork = scope.ServiceProvider.GetRequiredService<ShoppingFood.Core.Interfaces.IUnitOfWork>();
                    await unitOfWork.LogErrorAsync(action, ex);
                }
            }
            catch
            {
                
            }
        }
    }

}
