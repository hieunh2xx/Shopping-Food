using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Models;
using ShoppingFood.Application.Options;

namespace ShoppingFood.Application.Services
{
    /// <summary>
    /// Truy vấn giao dịch ngân hàng qua SePay API v2 — dùng khi webhook miss (server tắt / ngrok 502).
    /// Docs: https://developer.sepay.vn/vi/sepay-api/v2/giao-dich/danh-sach
    /// </summary>
    public class SepayTransactionApiClient : ISepayTransactionApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly SepayOptions _options;
        private readonly ILogger<SepayTransactionApiClient> _logger;

        public SepayTransactionApiClient(
            HttpClient httpClient,
            IOptions<SepayOptions> options,
            ILogger<SepayTransactionApiClient> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _logger = logger;
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.ApiBearerToken);

        public async Task<IReadOnlyList<SepayTransactionRecord>> SearchIncomingTransactionsAsync(
            string searchQuery,
            decimal? amount,
            DateTime? fromUtc,
            DateTime? toUtc,
            CancellationToken cancellationToken = default)
        {
            if (!IsConfigured)
                return Array.Empty<SepayTransactionRecord>();

            var baseUrl = _options.UseSandbox
                ? "https://userapi-sandbox.sepay.vn/v2/transactions"
                : "https://userapi.sepay.vn/v2/transactions";

            var query = new List<string>
            {
                "transfer_type=in",
                "per_page=50",
                "transaction_date_sort=desc",
                $"q={Uri.EscapeDataString(searchQuery)}"
            };

            if (amount.HasValue)
            {
                var amt = (long)Math.Round(amount.Value, 0);
                query.Add($"amount_in_min={amt}");
                query.Add($"amount_in_max={amt}");
            }

            if (fromUtc.HasValue)
                query.Add($"transaction_date_from={FormatSepayDate(fromUtc.Value)}");

            if (toUtc.HasValue)
                query.Add($"transaction_date_to={FormatSepayDate(toUtc.Value)}");

            var url = $"{baseUrl}?{string.Join("&", query)}";

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiBearerToken);

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("SePay transactions API returned {StatusCode} for q={Query}", response.StatusCode, searchQuery);
                    return Array.Empty<SepayTransactionRecord>();
                }

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
                    return Array.Empty<SepayTransactionRecord>();

                var results = new List<SepayTransactionRecord>();
                foreach (var item in data.EnumerateArray())
                {
                    results.Add(new SepayTransactionRecord
                    {
                        Id = item.TryGetProperty("id", out var id) ? id.GetString() ?? string.Empty : string.Empty,
                        TransferType = item.TryGetProperty("transfer_type", out var tt) ? tt.GetString() ?? "in" : "in",
                        AmountIn = item.TryGetProperty("amount_in", out var amtIn) && amtIn.TryGetDecimal(out var dec)
                            ? dec
                            : 0,
                        TransactionContent = item.TryGetProperty("transaction_content", out var tc)
                            ? tc.GetString()
                            : null,
                        Code = item.TryGetProperty("code", out var code) && code.ValueKind != JsonValueKind.Null
                            ? code.GetString()
                            : null,
                        ReferenceNumber = item.TryGetProperty("reference_number", out var rn)
                            ? rn.GetString()
                            : null,
                        TransactionDate = item.TryGetProperty("transaction_date", out var td)
                            ? ParseSepayDate(td.GetString())
                            : null,
                        WebhookSuccess = item.TryGetProperty("webhook_success", out var ws) && ws.ValueKind == JsonValueKind.Number
                            ? ws.GetInt32()
                            : null
                    });
                }

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SePay transactions API search failed for q={Query}", searchQuery);
                return Array.Empty<SepayTransactionRecord>();
            }
        }

        private static string FormatSepayDate(DateTime utc)
        {
            var vn = utc.AddHours(7);
            return vn.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
        }

        private static DateTime? ParseSepayDate(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dt))
                return dt;
            return null;
        }
    }
}
