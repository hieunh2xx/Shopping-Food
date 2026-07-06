using ShoppingFood.Core.Repository;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Repository.Implementations
{
    public class WalletRepository : RepositoryBase<Wallet>, IWalletRepository
    {
        public WalletRepository(ShoppingFoodContext dbContext) : base(dbContext) { }
    }

    public class FinancialTransactionRepository : RepositoryBase<FinancialTransaction>, IFinancialTransactionRepository
    {
        public FinancialTransactionRepository(ShoppingFoodContext dbContext) : base(dbContext) { }
    }

    public class WithdrawalRequestRepository : RepositoryBase<WithdrawalRequest>, IWithdrawalRequestRepository
    {
        public WithdrawalRequestRepository(ShoppingFoodContext dbContext) : base(dbContext) { }
    }

    public class EInvoiceRequestRepository : RepositoryBase<EInvoiceRequest>, IEInvoiceRequestRepository
    {
        public EInvoiceRequestRepository(ShoppingFoodContext dbContext) : base(dbContext) { }
    }

    public class PlatformFinanceConfigRepository : RepositoryBase<PlatformFinanceConfig>, IPlatformFinanceConfigRepository
    {
        public PlatformFinanceConfigRepository(ShoppingFoodContext dbContext) : base(dbContext) { }
    }

    public class PaymentSessionRepository : RepositoryBase<PaymentSession>, IPaymentSessionRepository
    {
        public PaymentSessionRepository(ShoppingFoodContext dbContext) : base(dbContext) { }
    }
}
