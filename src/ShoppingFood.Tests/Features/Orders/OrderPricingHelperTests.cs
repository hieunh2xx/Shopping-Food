using FluentAssertions;
using ShoppingFood.Application.Common;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Tests.Features.Orders
{
    public class OrderPricingHelperTests
    {
        [Fact]
        public void CalculateVoucherAmount_Percentage_RespectsMaxCap()
        {
            var discount = new Discount
            {
                Type = DiscountType.Percentage,
                Value = 50,
                MaxDiscountAmount = 10_000m
            };

            var amount = OrderPricingHelper.CalculateVoucherAmount(discount, 150_000m, 0);
            amount.Should().Be(10_000m);
        }

        [Fact]
        public void ResolveDisplayedDiscounts_PersistedSplit_KeepsVoucherAndTierSeparate()
        {
            var order = new Order
            {
                ItemsSubtotal = 150_000m,
                ShippingFee = 15_000m,
                TotalAmount = 150_500m,
                DiscountAmount = 10_000m,
                TierDiscountAmount = 4_500m
            };

            var (voucher, tier) = OrderPricingHelper.ResolveDisplayedDiscounts(order, 150_000m);
            voucher.Should().Be(10_000m);
            tier.Should().Be(4_500m);
        }

        [Fact]
        public void ResolveDisplayedDiscounts_LegacyCombinedGap_SplitsUsingVoucherCap()
        {
            var order = new Order
            {
                ItemsSubtotal = 150_000m,
                ShippingFee = 15_000m,
                TotalAmount = 150_500m,
                DiscountAmount = 0,
                TierDiscountAmount = 0,
                AppliedDiscount = new Discount
                {
                    Type = DiscountType.Percentage,
                    Value = 50,
                    MaxDiscountAmount = 10_000m
                }
            };

            var (voucher, tier) = OrderPricingHelper.ResolveDisplayedDiscounts(order, 150_000m);
            voucher.Should().Be(10_000m);
            tier.Should().Be(4_500m);
        }
    }
}
