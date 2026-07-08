namespace ShoppingFood.Application.Models
{
    public class SepayReconcileResult
    {
        public bool Success { get; init; }
        public bool AlreadyPaid { get; init; }
        public bool MatchedOnSepay { get; init; }
        public bool IsSkippedCooldown { get; init; }
        public string Message { get; init; } = string.Empty;
        public string? ExternalTransactionId { get; init; }

        public static SepayReconcileResult SkippedCooldown() => new()
        {
            IsSkippedCooldown = true,
            Message = "Đang chờ cooldown đồng bộ."
        };

        public static SepayReconcileResult AlreadyConfirmed() => new()
        {
            Success = true,
            AlreadyPaid = true,
            Message = "Thanh toán đã được xác nhận trước đó."
        };

        public static SepayReconcileResult NotFound(string reason) => new()
        {
            Message = reason
        };

        public static SepayReconcileResult Confirmed(string externalId) => new()
        {
            Success = true,
            MatchedOnSepay = true,
            ExternalTransactionId = externalId,
            Message = "Đã đồng bộ giao dịch từ SePay API."
        };
    }
}
