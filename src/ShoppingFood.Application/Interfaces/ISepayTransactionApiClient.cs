using ShoppingFood.Application.Models;

namespace ShoppingFood.Application.Interfaces
{
    public interface ISepayTransactionApiClient
    {
        bool IsConfigured { get; }
        Task<IReadOnlyList<SepayTransactionRecord>> SearchIncomingTransactionsAsync(
            string searchQuery,
            decimal? amount,
            DateTime? fromUtc,
            DateTime? toUtc,
            CancellationToken cancellationToken = default);
    }
}
