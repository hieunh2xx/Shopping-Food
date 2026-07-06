using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Application.Services
{
    public static class PaymentSessionStatusHelper
    {
        /// <summary>
        /// SePay chỉ coi là đã thanh toán khi webhook/IPN đã ghi nhận mã giao dịch ngoài.
        /// </summary>
        public static bool IsWebhookConfirmed(PaymentSession session)
        {
            if (session.PaymentMethod != PaymentMethod.Sepay)
                return session.Status == PaymentSessionStatus.Completed;

            return session.Status == PaymentSessionStatus.Completed
                && (!string.IsNullOrWhiteSpace(session.ExternalTransactionId)
                    || !string.IsNullOrWhiteSpace(session.SepayOrderId));
        }

        public static bool IsAwaitingWebhook(PaymentSession session, int remainingSeconds)
        {
            return session.PaymentMethod == PaymentMethod.Sepay
                && session.Status == PaymentSessionStatus.Pending
                && remainingSeconds > 0;
        }
    }
}
