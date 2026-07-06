using ShoppingFood.Application.Models;

namespace ShoppingFood.Application.Interfaces
{
    public class SepayCheckoutForm
    {
        public string CheckoutUrl { get; set; } = string.Empty;
        public string Method { get; set; } = "POST";
        public Dictionary<string, string> Fields { get; set; } = new();
    }

    public interface ISepayService
    {
        bool IsEnabled { get; }
        string GenerateInvoiceNumber(Guid sessionId);
        SepayCheckoutForm BuildCheckoutForm(
            string invoiceNumber,
            decimal amount,
            string description,
            string? customerId,
            string? paymentMethod = null);
        bool VerifyIpnSecret(string? headerSecret);
        bool VerifyWebhookAuth(string? authorizationHeader, string rawBody, string? signatureHeader, string? timestampHeader);
        bool VerifyWebhookSignature(string rawBody, string? signatureHeader, string? timestampHeader);
        string BuildTransferContent(string invoiceNumber);
        string? ResolveInvoiceFromTransferCode(string transferCode);
        string BuildQrImageUrl(string invoiceNumber, decimal amount, SepayBankAccountInfo bank, string? description = null);
    }
}
