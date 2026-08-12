using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Repository.Interfaces
{
    public interface IWalletRepository : IAsyncRepository<Wallet> { }
    public interface IFinancialTransactionRepository : IAsyncRepository<FinancialTransaction> { }
    public interface IWithdrawalRequestRepository : IAsyncRepository<WithdrawalRequest> { }
    public interface ICodRemittanceRequestRepository : IAsyncRepository<CodRemittanceRequest> { }
    public interface IEInvoiceRequestRepository : IAsyncRepository<EInvoiceRequest> { }
    public interface IPlatformFinanceConfigRepository : IAsyncRepository<PlatformFinanceConfig> { }
    public interface IPaymentSessionRepository : IAsyncRepository<PaymentSession> { }
    public interface ISepayWebhookLogRepository : IAsyncRepository<SepayWebhookLog> { }
}
