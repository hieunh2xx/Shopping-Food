using FluentAssertions;
using Moq;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Services;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Payments
{
    public class PaymentSettlementSplitTests
    {
        private readonly PaymentSettlementService _sut = new(
            Mock.Of<IPlatformFinanceConfigRepository>(),
            Mock.Of<IWalletRepository>(),
            Mock.Of<IFinancialTransactionRepository>(),
            Mock.Of<IPaymentSessionRepository>(),
            Mock.Of<IOrderRepository>(),
            Mock.Of<IRestaurantProfileRepository>(),
            Mock.Of<IShipperProfileRepository>(),
            Mock.Of<IUnitOfWork>(),
            Mock.Of<ISepayService>(),
            Mock.Of<IPaymentCacheService>(),
            Mock.Of<ISepayBankAccountResolver>(),
            Mock.Of<INotificationRepository>());

        [Theory]
        [InlineData(115_000, 15_000, 0, 0.10, false, 100_000, 10_000, 90_000, 0)]
        [InlineData(115_000, 15_000, 0, 0.10, true, 100_000, 10_000, 105_000, 0)]
        [InlineData(100_000, 0, 12_000, 0.10, false, 100_000, 10_000, 90_000, 12_000)]
        public void CalculateSplit_MatchesExpected(
            decimal total, decimal shipping, decimal shipperIncome, decimal rate, bool selfDelivery,
            decimal expectedItems, decimal expectedCommission, decimal expectedSeller, decimal expectedShipper)
        {
            var (items, commission, seller, shipper) = _sut.CalculateSplit(total, shipping, shipperIncome, rate, selfDelivery);
            items.Should().Be(expectedItems);
            commission.Should().Be(expectedCommission);
            seller.Should().Be(expectedSeller);
            shipper.Should().Be(expectedShipper);
        }
    }
}
