using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Services
{
    public class OrderShipperClaimService : IOrderShipperClaimService
    {
        private readonly ShoppingFoodContext _dbContext;

        public OrderShipperClaimService(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<bool> TryClaimAsync(Guid orderId, Guid shipperProfileId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var waiting = OrderStatus.WaitingForShipper.ToString();
            var shipping = OrderStatus.Shipping.ToString();

            // Atomic claim — chỉ 1 request thắng khi 2 shipper bấm cùng lúc
            var rows = await _dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE [ORDER]
                SET [ShipperId] = {shipperProfileId},
                    [Status] = {shipping},
                    [UpdatedAt] = {now}
                WHERE [Id] = {orderId}
                  AND [ShipperId] IS NULL
                  AND [Status] = {waiting}",
                cancellationToken);

            return rows > 0;
        }
    }
}
