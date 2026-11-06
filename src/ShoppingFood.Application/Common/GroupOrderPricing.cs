using System;
using System.Linq;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Application.Common
{
    /// <summary>
    /// Ship gom đơn = phí cơ bản (quán → trường) chia đều + phụ phí mỗi người theo hình thức giao (sảnh / tận phòng).
    /// Shipper nhận toàn bộ tiền ship của nhóm, nên càng đông người thì mỗi người trả ít hơn còn shipper nhận nhiều hơn.
    /// </summary>
    public static class GroupOrderPricing
    {
        public static decimal SurchargeFor(Campus campus, GroupDeliveryMode mode) => mode switch
        {
            GroupDeliveryMode.Room => campus.RoomSurchargePerMember,
            GroupDeliveryMode.Lobby => campus.LobbySurchargePerMember,
            _ => 0m
        };

        public static decimal ShareFor(decimal baseFee, decimal surcharge, int memberCount)
        {
            var n = Math.Max(1, memberCount);
            return RoundUpTo500(baseFee / n) + surcharge;
        }

        /// <summary>Số người dùng để chia ship: không thấp hơn MinMembers vì đơn chỉ được chốt khi đủ người.</summary>
        public static int BillableCount(GroupOrder group, int activeMembers)
            => Math.Min(Math.Max(activeMembers, group.MinMembers), Math.Max(group.MaxMembers, group.MinMembers));

        /// <summary>Phí ship tạm thu khi thanh toán trước — mức cao nhất có thể (đúng bằng số người tối thiểu).</summary>
        public static decimal PrepayShare(GroupOrder group)
            => ShareFor(group.BaseShippingFee, group.SurchargePerMember, group.MinMembers);

        public static decimal CurrentShare(GroupOrder group)
        {
            var active = group.Members.Count(m => m.Items.Any());
            return ShareFor(group.BaseShippingFee, group.SurchargePerMember, BillableCount(group, active));
        }

        public static void Recalculate(GroupOrder group)
        {
            var share = CurrentShare(group);
            decimal items = 0, shipping = 0;
            foreach (var member in group.Members)
            {
                member.ItemsSubtotal = member.Items.Sum(i => i.UnitPrice * i.Quantity);
                member.ShippingShare = member.ItemsSubtotal > 0 ? share : 0;
                items += member.ItemsSubtotal;
                shipping += member.ShippingShare;
            }

            group.ItemsSubtotal = items;
            group.ShippingFeeTotal = shipping;
            group.ShipperIncome = shipping;
            group.TotalAmount = items + shipping;
            group.UpdatedAt = DateTime.UtcNow;
        }

        public static decimal AmountDue(GroupOrderMember member) => member.ItemsSubtotal + member.ShippingShare;

        public static decimal PrepayAmount(GroupOrder group, GroupOrderMember member)
            => member.ItemsSubtotal > 0 ? member.ItemsSubtotal + PrepayShare(group) : 0;

        private static decimal RoundUpTo500(decimal value) => Math.Ceiling(value / 500m) * 500m;
    }
}
