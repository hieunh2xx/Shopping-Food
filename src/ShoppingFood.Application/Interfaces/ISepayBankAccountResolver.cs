using ShoppingFood.Application.Models;

namespace ShoppingFood.Application.Interfaces
{
    public interface ISepayBankAccountResolver
    {
        Task<SepayBankAccountInfo?> ResolveAsync(CancellationToken cancellationToken = default);
    }
}
