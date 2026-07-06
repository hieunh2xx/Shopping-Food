using MediatR;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Application.Features.Payments.Queries
{
    public class GetPaymentMethodsQuery : IRequest<ApiResponse> { }

    public class GetPaymentMethodsHandler : IRequestHandler<GetPaymentMethodsQuery, ApiResponse>
    {
        private readonly IPaymentSettlementService _paymentService;

        public GetPaymentMethodsHandler(IPaymentSettlementService paymentService)
        {
            _paymentService = paymentService;
        }

        public async Task<ApiResponse> Handle(GetPaymentMethodsQuery request, CancellationToken cancellationToken)
        {
            var config = await _paymentService.GetConfigAsync();
            var methods = new[]
            {
                new { code = "COD", name = "Tiền mặt (COD)", description = "Thanh toán khi nhận hàng", requiresAuth = false, icon = "cash" },
                new { code = "CreditCard", name = "Thẻ quốc tế", description = "Visa, Mastercard, JCB", requiresAuth = true, icon = "card" },
                new { code = "EWallet", name = "Ví điện tử", description = "Momo, ZaloPay, VNPay", requiresAuth = true, icon = "wallet" },
                new { code = "SystemWallet", name = "Ví tích lũy", description = "Thanh toán bằng số dư ví hệ thống", requiresAuth = true, icon = "system-wallet" }
            };
            var eWalletProviders = new[]
            {
                new { code = "Momo", name = "MoMo" },
                new { code = "ZaloPay", name = "ZaloPay" },
                new { code = "VNPay", name = "VNPay" }
            };
            return ApiResponse.Success(new
            {
                methods,
                eWalletProviders,
                commissionRate = config.CommissionRate,
                minWithdrawal = config.MinWithdrawalAmount
            }, "Payment methods retrieved.");
        }
    }
}
