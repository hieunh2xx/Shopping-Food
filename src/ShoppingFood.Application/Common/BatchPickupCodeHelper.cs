using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace ShoppingFood.Application.Common
{
    /// <summary>
    /// Deterministic 6-char pickup code for a shipper's batch at one restaurant.
    /// Code changes when the eligible order set changes.
    /// </summary>
    public static class BatchPickupCodeHelper
    {
        public static string Compute(Guid shipperProfileId, Guid restaurantId, IEnumerable<Guid> eligibleOrderIds)
        {
            var orderedIds = (eligibleOrderIds ?? Enumerable.Empty<Guid>())
                .Distinct()
                .OrderBy(id => id)
                .ToList();

            if (orderedIds.Count == 0)
                return string.Empty;

            var payload = $"{shipperProfileId:N}|{restaurantId:N}|{string.Join(",", orderedIds.Select(id => id.ToString("N")))}";
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
            var sb = new StringBuilder(6);
            for (var i = 0; i < hash.Length && sb.Length < 6; i++)
            {
                // Alphanumeric A-Z / 0-9 for easy merchant readout
                var n = hash[i] % 36;
                sb.Append(n < 10 ? (char)('0' + n) : (char)('A' + (n - 10)));
            }

            return sb.ToString();
        }
    }
}
