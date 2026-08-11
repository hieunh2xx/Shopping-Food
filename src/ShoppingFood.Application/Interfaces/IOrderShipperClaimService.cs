using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Interfaces
{
    public interface IOrderShipperClaimService
    {
        /// <summary>
        /// Atomically assigns shipper when order is still WaitingForShipper and unassigned.
        /// Returns false if another shipper/coordinator already claimed it.
        /// </summary>
        Task<bool> TryClaimAsync(Guid orderId, Guid shipperProfileId, CancellationToken cancellationToken = default);
    }
}
