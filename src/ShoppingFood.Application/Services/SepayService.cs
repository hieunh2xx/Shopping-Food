using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Models;
using ShoppingFood.Application.Options;

namespace ShoppingFood.Application.Services
{
    public class SepayService : ISepayService
    {
        private static readonly string[] SignedFieldOrder =
        {
            "order_amount", "merchant", "currency", "operation",
            "order_description", "order_invoice_number", "customer_id",
            "payment_method", "success_url", "error_url", "cancel_url"
        };

        private readonly SepayOptions _options;

        public SepayService(IOptions<SepayOptions> options)
        {
            _options = options.Value;
        }

        public bool IsEnabled => _options.IsConfigured;

        public string GenerateInvoiceNumber(Guid sessionId)
        {
            // Mã ngắn (≤10 ký tự) để ghép "SEVQR {code}" vẫn ≤25 ký tự trong VietQR.
            var suffix = sessionId.ToString("N")[..8].ToUpperInvariant();
            return $"{_options.PaymentCodePrefix}{suffix}";
        }

        /// <summary>Nội dung CK trên QR — VietinBank: "SEVQR {mã}" (có dấu cách), tối đa 25 ký tự.</summary>
        public string BuildTransferContent(string invoiceNumber)
        {
            var code = SanitizeTransferText(invoiceNumber);
            if (string.IsNullOrEmpty(code))
                return string.Empty;

            var keyword = _options.VietQrTransferKeyword.Trim().ToUpperInvariant();
            if (string.IsNullOrEmpty(keyword))
                return TruncateTransferContent(code);

            if (code.StartsWith(keyword, StringComparison.OrdinalIgnoreCase))
                return TruncateTransferContent(NormalizeTransferSpacing(code));

            // SePay VietinBank: des=SEVQR%20DH001
            return TruncateTransferContent($"{keyword} {code}");
        }

        /// <summary>Trích mã hóa đơn nội bộ từ nội dung CK / webhook code / content (regex theo docs SePay).</summary>
        public string? ResolveInvoiceFromTransferCode(string transferCode)
        {
            if (string.IsNullOrWhiteSpace(transferCode))
                return null;

            var normalized = NormalizeTransferSpacing(SanitizeTransferText(transferCode));
            var prefix = Regex.Escape(_options.PaymentCodePrefix.Trim().ToUpperInvariant());
            if (!string.IsNullOrEmpty(prefix))
            {
                var match = Regex.Match(
                    normalized,
                    $@"{prefix}[A-Z0-9]{{4,12}}",
                    RegexOptions.IgnoreCase);
                if (match.Success)
                    return match.Value.ToUpperInvariant();
            }

            var keyword = _options.VietQrTransferKeyword.Trim().ToUpperInvariant();
            if (!string.IsNullOrEmpty(keyword)
                && normalized.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                var keywordIndex = normalized.IndexOf(keyword, StringComparison.OrdinalIgnoreCase);
                var afterKeyword = normalized[(keywordIndex + keyword.Length)..].TrimStart();
                var token = afterKeyword
                    .Split([' '], StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(token))
                    return token.ToUpperInvariant();
            }

            var tokenFallback = normalized
                .Split([' '], StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault();

            return string.IsNullOrWhiteSpace(tokenFallback) ? null : tokenFallback.ToUpperInvariant();
        }

        private static string SanitizeTransferText(string value)
        {
            var sb = new StringBuilder(value.Length);
            foreach (var c in value.Trim())
            {
                if (char.IsLetterOrDigit(c))
                    sb.Append(char.ToUpperInvariant(c));
                else if (c == ' ')
                    sb.Append(' ');
            }

            return NormalizeTransferSpacing(sb.ToString());
        }

        private static string NormalizeTransferSpacing(string value) =>
            string.Join(' ', value.Split(' ', StringSplitOptions.RemoveEmptyEntries));

        private string TruncateTransferContent(string value)
        {
            var max = Math.Max(1, _options.MaxVietQrTransferLength);
            if (value.Length <= max)
                return value;

            var keyword = _options.VietQrTransferKeyword.Trim().ToUpperInvariant();
            if (!string.IsNullOrEmpty(keyword)
                && value.StartsWith($"{keyword} ", StringComparison.OrdinalIgnoreCase))
            {
                var prefix = $"{keyword} ";
                var room = max - prefix.Length;
                if (room > 0)
                    return prefix + value[prefix.Length..].TrimStart()[..Math.Min(room, value.Length - prefix.Length)];
            }

            return value[..max];
        }

        public SepayCheckoutForm BuildCheckoutForm(
            string invoiceNumber,
            decimal amount,
            string description,
            string? customerId,
            string? paymentMethod = null)
        {
            var amountInt = (long)Math.Round(amount, 0);
            var baseUrl = _options.FrontendBaseUrl.TrimEnd('/');

            var fields = new Dictionary<string, string>
            {
                ["merchant"] = _options.MerchantId,
                ["currency"] = "VND",
                ["order_amount"] = amountInt.ToString(),
                ["operation"] = "PURCHASE",
                ["order_description"] = description,
                ["order_invoice_number"] = invoiceNumber,
                ["customer_id"] = customerId ?? "GUEST",
                ["success_url"] = $"{baseUrl}/payment/success?invoice={Uri.EscapeDataString(invoiceNumber)}",
                ["error_url"] = $"{baseUrl}/payment/error?invoice={Uri.EscapeDataString(invoiceNumber)}",
                ["cancel_url"] = $"{baseUrl}/payment/cancel?invoice={Uri.EscapeDataString(invoiceNumber)}",
            };

            if (!string.IsNullOrWhiteSpace(paymentMethod))
                fields["payment_method"] = paymentMethod;

            fields["signature"] = CreateSignature(fields, _options.SecretKey);

            return new SepayCheckoutForm
            {
                CheckoutUrl = _options.CheckoutBaseUrl,
                Method = "POST",
                Fields = fields
            };
        }

        public bool VerifyIpnSecret(string? headerSecret)
        {
            if (string.IsNullOrWhiteSpace(_options.IpnSecretKey))
                return true;
            return string.Equals(headerSecret, _options.IpnSecretKey, StringComparison.Ordinal);
        }

        public bool VerifyWebhookAuth(
            string? authorizationHeader,
            string rawBody,
            string? signatureHeader,
            string? timestampHeader)
        {
            if (!string.IsNullOrWhiteSpace(_options.WebhookApiKey))
            {
                var expected = $"Apikey {_options.WebhookApiKey.Trim()}";
                return string.Equals(authorizationHeader?.Trim(), expected, StringComparison.Ordinal);
            }

            return VerifyWebhookSignature(rawBody, signatureHeader, timestampHeader);
        }

        public bool VerifyWebhookSignature(string rawBody, string? signatureHeader, string? timestampHeader)
        {
            if (string.IsNullOrWhiteSpace(_options.WebhookSecret))
                return true;

            if (string.IsNullOrWhiteSpace(signatureHeader) || string.IsNullOrWhiteSpace(timestampHeader))
                return false;

            if (!long.TryParse(timestampHeader, out var ts))
                return false;

            if (Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - ts) > 300)
                return false;

            var expected = "sha256=" + ComputeHmacHex($"{timestampHeader}.{rawBody}", _options.WebhookSecret);
            var provided = signatureHeader.Trim();

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expected),
                Encoding.UTF8.GetBytes(provided));
        }

        public static string CreateSignature(Dictionary<string, string> fields, string secretKey)
        {
            var parts = new List<string>();
            foreach (var field in SignedFieldOrder)
            {
                if (fields.TryGetValue(field, out var value) && !string.IsNullOrEmpty(value))
                    parts.Add($"{field}={value}");
            }

            var signedString = string.Join(",", parts);
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedString));
            return Convert.ToBase64String(hash);
        }

        private static string ComputeHmacHex(string data, string secret)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        public string BuildQrImageUrl(string invoiceNumber, decimal amount, SepayBankAccountInfo bank, string? description = null)
        {
            if (string.IsNullOrWhiteSpace(bank.AccountNumber) || string.IsNullOrWhiteSpace(bank.BankName))
                return string.Empty;

            var transferContent = BuildTransferContent(invoiceNumber);

            var query = new Dictionary<string, string>
            {
                ["acc"] = bank.AccountNumber.Trim(),
                ["bank"] = bank.BankName.Trim(),
                ["amount"] = ((long)Math.Round(amount, 0)).ToString(),
                ["des"] = description ?? transferContent,
                ["template"] = "compact",
                ["showinfo"] = "true"
            };

            if (!string.IsNullOrWhiteSpace(bank.AccountHolder))
                query["holder"] = bank.AccountHolder.Trim();

            return $"{_options.QrBaseUrl}?{string.Join("&", query.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"))}";
        }
    }
}
