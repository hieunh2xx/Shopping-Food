using ShoppingFood.Application.Models;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Application.Services
{
    public sealed class PaymentDisplayStatus
    {
        public const string Paid = "paid";
        public const string AwaitingPayment = "awaiting_payment";
        public const string Processing = "processing";
        public const string Expired = "expired";
        public const string Failed = "failed";
        public const string Pending = "pending";

        public string Code { get; init; } = Pending;
        public string Label { get; init; } = "Chờ xử lý";

        public static PaymentDisplayStatus Resolve(
            PaymentSession session,
            PaymentCacheEntry? cached,
            int remainingSeconds)
        {
            if (PaymentSessionStatusHelper.IsWebhookConfirmed(session))
                return new() { Code = Paid, Label = "Đã thanh toán" };

            if (session.Status == PaymentSessionStatus.Failed)
                return new() { Code = Failed, Label = "Thanh toán thất bại" };

            if (session.Status == PaymentSessionStatus.Expired
                || (session.Status == PaymentSessionStatus.Pending && remainingSeconds <= 0))
                return new() { Code = Expired, Label = "Hết hạn thanh toán" };

            if (cached?.Status == "Processing")
                return new() { Code = Processing, Label = "Đang xác nhận thanh toán" };

            if (PaymentSessionStatusHelper.IsAwaitingWebhook(session, remainingSeconds))
                return new() { Code = AwaitingPayment, Label = "Chờ chuyển khoản" };

            if (session.Status == PaymentSessionStatus.Pending)
                return new() { Code = Pending, Label = "Chờ thanh toán" };

            if (session.Status == PaymentSessionStatus.Completed)
                return new() { Code = Paid, Label = "Đã thanh toán" };

            return new() { Code = Pending, Label = "Chờ xử lý" };
        }
    }

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
