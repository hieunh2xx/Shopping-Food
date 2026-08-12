using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ShoppingFood.Application.Common
{
    public static class MemberTierHelper
    {
        public static string ToVietnamese(MemberTier tier) => tier switch
        {
            MemberTier.Bronze => "Đồng",
            MemberTier.Silver => "Bạc",
            MemberTier.Gold => "Vàng",
            MemberTier.Diamond => "Kim cương",
            _ => tier.ToString()
        };

        public static string ToVietnamese(string? tier)
        {
            if (string.IsNullOrWhiteSpace(tier)) return ToVietnamese(MemberTier.Bronze);
            return Enum.TryParse<MemberTier>(tier, true, out var parsed)
                ? ToVietnamese(parsed)
                : tier;
        }

        /// <summary>
        /// Xếp hạng theo cấu hình MinPoints (cao → thấp). Tự động lên hạng khi đạt mốc.
        /// </summary>
        public static MemberTier Determine(int totalEarnedPoints, IEnumerable<MemberTierConfig>? configs)
        {
            var ordered = (configs ?? Enumerable.Empty<MemberTierConfig>())
                .OrderByDescending(c => c.MinPoints)
                .ToList();

            if (ordered.Count == 0)
            {
                if (totalEarnedPoints >= 1000) return MemberTier.Diamond;
                if (totalEarnedPoints >= 500) return MemberTier.Gold;
                if (totalEarnedPoints >= 100) return MemberTier.Silver;
                return MemberTier.Bronze;
            }

            foreach (var config in ordered)
            {
                if (totalEarnedPoints >= config.MinPoints)
                    return config.Tier;
            }

            return MemberTier.Bronze;
        }
    }
}
