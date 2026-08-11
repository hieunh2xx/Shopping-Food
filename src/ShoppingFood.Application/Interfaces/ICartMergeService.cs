using System;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Interfaces
{
    /// <summary>
    /// Moves guest-cart items into the authenticated user's cart (e.g. after login / before checkout).
    /// </summary>
    public interface ICartMergeService
    {
        Task MergeGuestCartIntoUserAsync(Guid userId, Guid guestUserId, CancellationToken cancellationToken = default);
    }
}
