namespace ShoppingFood.Application.Common
{
    /// <summary>Mã đơn ngắn, dễ đọc cho thông báo / UI người dùng.</summary>
    public static class OrderDisplayHelper
    {
        public static string ShortId(Guid orderId) =>
            orderId.ToString("N")[..8].ToUpperInvariant();

        public static string ShortId(string? orderId)
        {
            if (string.IsNullOrWhiteSpace(orderId)) return "—";
            var cleaned = orderId.Replace("-", "");
            return cleaned.Length >= 8
                ? cleaned[..8].ToUpperInvariant()
                : cleaned.ToUpperInvariant();
        }
    }
}
