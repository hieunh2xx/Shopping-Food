using System.Threading.Channels;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Models;

namespace ShoppingFood.Application.Services
{
    /// <summary>
    /// In-process durable queue (Channel). Swap to RabbitMQ/Azure Service Bus in production.
    /// </summary>
    public class PaymentMessageQueue : IPaymentMessageQueue
    {
        private readonly Channel<PaymentConfirmationMessage> _channel =
            Channel.CreateUnbounded<PaymentConfirmationMessage>(new UnboundedChannelOptions
            {
                SingleReader = false,
                SingleWriter = false
            });

        public int PendingCount => _channel.Reader.Count;

        public async ValueTask EnqueueAsync(PaymentConfirmationMessage message, CancellationToken ct = default)
        {
            await _channel.Writer.WriteAsync(message, ct);
        }

        public async IAsyncEnumerable<PaymentConfirmationMessage> ReadAllAsync(
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken ct)
        {
            await foreach (var item in _channel.Reader.ReadAllAsync(ct))
                yield return item;
        }
    }
}
