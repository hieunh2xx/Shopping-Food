using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Application.Common
{
    public static class OrderPricingHelper
    {
        public static decimal CalculateVoucherAmount(Discount discount, decimal itemsTotal, decimal shippingFee)
        {
            if (discount.Type == DiscountType.Percentage)
            {
                var amount = itemsTotal * (discount.Value / 100);
                if (discount.MaxDiscountAmount.HasValue && amount > discount.MaxDiscountAmount.Value)
                    amount = discount.MaxDiscountAmount.Value;
                return amount;
            }

            if (discount.Type == DiscountType.FixedAmount)
                return Math.Min(discount.Value, itemsTotal);

            if (discount.Type == DiscountType.FreeShipping)
                return Math.Max(0, shippingFee);

            return 0;
        }

        /// <summary>
        /// Voucher and member-tier discounts as separate lines.
        /// New orders persist both amounts; older orders split the combined gap using AppliedDiscount.
        /// </summary>
        public static (decimal VoucherAmount, decimal TierDiscountAmount) ResolveDisplayedDiscounts(Order order, decimal displaySubtotal)
        {
            if (order.DiscountAmount > 0 || order.TierDiscountAmount > 0)
                return (order.DiscountAmount, order.TierDiscountAmount);

            var combined = Math.Max(0, displaySubtotal - Math.Max(0, order.TotalAmount - order.ShippingFee));
            if (combined <= 0)
                return (0, 0);

            decimal voucher = 0;
            if (order.AppliedDiscount != null)
                voucher = Math.Min(
                    CalculateVoucherAmount(order.AppliedDiscount, displaySubtotal, order.ShippingFee),
                    combined);

            return (voucher, Math.Max(0, combined - voucher));
        }
    }
}
