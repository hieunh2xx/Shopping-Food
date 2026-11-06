using FluentAssertions;
using ShoppingFood.Application.Common;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Tests.Features.GroupOrders
{
    public class GroupOrderPricingTests
    {
        private static GroupOrder NewGroup(int activeMembers, decimal itemPrice = 45_000m)
        {
            var group = new GroupOrder
            {
                Id = Guid.NewGuid(),
                MinMembers = 3,
                MaxMembers = 10,
                BaseShippingFee = 15_000m,
                SurchargePerMember = 8_000m,
                DeliveryMode = GroupDeliveryMode.Room
            };
            for (var i = 0; i < activeMembers; i++)
            {
                var member = new GroupOrderMember { Id = Guid.NewGuid(), UserAccountId = Guid.NewGuid(), IsHost = i == 0 };
                member.Items.Add(new GroupOrderItem { Id = Guid.NewGuid(), Quantity = 1, UnitPrice = itemPrice });
                group.Members.Add(member);
            }
            return group;
        }

        [Fact]
        public void ShareFor_SplitsBaseFeeAndAddsSurcharge_RoundedUpTo500()
        {
            GroupOrderPricing.ShareFor(15_000m, 8_000m, 4).Should().Be(12_000m); // 3,750 -> 4,000 + 8,000
            GroupOrderPricing.ShareFor(15_000m, 0m, 3).Should().Be(5_000m);
        }

        [Fact]
        public void Recalculate_FiveMembers_ShipperGetsAllShippingMoney()
        {
            var group = NewGroup(5);

            GroupOrderPricing.Recalculate(group);

            group.Members.Should().OnlyContain(m => m.ShippingShare == 11_000m); // 3,000 + 8,000
            group.ShippingFeeTotal.Should().Be(55_000m);
            group.ShipperIncome.Should().Be(group.ShippingFeeTotal);
            group.TotalAmount.Should().Be(5 * 45_000m + 55_000m);
        }

        [Fact]
        public void Recalculate_BelowMinimum_UsesMinMembersForShare()
        {
            var group = NewGroup(2);

            GroupOrderPricing.Recalculate(group);

            group.Members.Should().OnlyContain(m => m.ShippingShare == GroupOrderPricing.PrepayShare(group));
        }

        [Fact]
        public void PrepayAmount_IsNeverLowerThanFinalDue()
        {
            var group = NewGroup(6);
            GroupOrderPricing.Recalculate(group);

            foreach (var member in group.Members)
                GroupOrderPricing.PrepayAmount(group, member).Should().BeGreaterThanOrEqualTo(GroupOrderPricing.AmountDue(member));
        }

        [Fact]
        public void Recalculate_MemberWithoutItems_PaysNoShipping()
        {
            var group = NewGroup(3);
            group.Members.Add(new GroupOrderMember { Id = Guid.NewGuid(), UserAccountId = Guid.NewGuid() });

            GroupOrderPricing.Recalculate(group);

            group.Members.Last().ShippingShare.Should().Be(0);
            GroupOrderPricing.PrepayAmount(group, group.Members.Last()).Should().Be(0);
        }
    }
}
