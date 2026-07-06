namespace ShoppingFood.Application.Options
{
    public class SepayOptions
    {
        public const string SectionName = "Sepay";

        public bool Enabled { get; set; }
        public bool UseSandbox { get; set; } = true;
        public string MerchantId { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        /// <summary>X-Secret-Key for Payment Gateway IPN.</summary>
        public string IpnSecretKey { get; set; } = string.Empty;
        /// <summary>HMAC secret for bank transfer webhooks (X-SePay-Signature).</summary>
        public string WebhookSecret { get; set; } = string.Empty;
        /// <summary>API Key xác thực webhook (Authorization: Apikey ...). Khuyến nghị theo docs SePay.</summary>
        public string WebhookApiKey { get; set; } = string.Empty;
        public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
        /// <summary>Prefix for payment code in transfer content (configure in SePay dashboard).</summary>
        public string PaymentCodePrefix { get; set; } = "SF";
        /// <summary>VietinBank + SePay: nội dung CK phải bắt đầu bằng SEVQR.</summary>
        public string VietQrTransferKeyword { get; set; } = "SEVQR";
        /// <summary>VietQR/NAPAS giới hạn nội dung CK trong mã QR (thường 25 ký tự).</summary>
        public int MaxVietQrTransferLength { get; set; } = 25;
        /// <summary>QR validity window in minutes.</summary>
        public int QrExpiryMinutes { get; set; } = 10;
        public string BankAccountNumber { get; set; } = string.Empty;
        public string BankName { get; set; } = "Vietcombank";
        public string AccountHolder { get; set; } = string.Empty;
        /// <summary>SePay API v2 Bearer token (my.sepay.vn) — dùng tự lấy TK ngân hàng nếu chưa cấu hình BankAccountNumber.</summary>
        public string ApiBearerToken { get; set; } = string.Empty;
        /// <summary>URL tạo ảnh VietQR động — docs SePay dùng https://vietqr.app/img</summary>
        public string QrBaseUrl { get; set; } = "https://vietqr.app/img";

        public bool HasQrBankConfig =>
            !string.IsNullOrWhiteSpace(BankAccountNumber) && !string.IsNullOrWhiteSpace(BankName);

        public string CheckoutBaseUrl => UseSandbox
            ? "https://pay-sandbox.sepay.vn/v1/checkout/init"
            : "https://pay.sepay.vn/v1/checkout/init";

        public bool IsConfigured =>
            Enabled && !string.IsNullOrWhiteSpace(MerchantId) && !string.IsNullOrWhiteSpace(SecretKey);
    }
}
