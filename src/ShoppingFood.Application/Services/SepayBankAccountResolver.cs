using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Models;
using ShoppingFood.Application.Options;

namespace ShoppingFood.Application.Services
{
    public class SepayBankAccountResolver : ISepayBankAccountResolver
    {
        private const string CacheKey = "sepay:bank-account";
        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

        private readonly HttpClient _httpClient;
        private readonly SepayOptions _options;
        private readonly IMemoryCache _cache;
        private readonly ILogger<SepayBankAccountResolver> _logger;

        public SepayBankAccountResolver(
            HttpClient httpClient,
            IOptions<SepayOptions> options,
            IMemoryCache cache,
            ILogger<SepayBankAccountResolver> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _cache = cache;
            _logger = logger;
        }

        public async Task<SepayBankAccountInfo?> ResolveAsync(CancellationToken cancellationToken = default)
        {
            if (_options.HasQrBankConfig)
            {
                return new SepayBankAccountInfo
                {
                    AccountNumber = _options.BankAccountNumber.Trim(),
                    BankName = _options.BankName.Trim(),
                    AccountHolder = _options.AccountHolder.Trim()
                };
            }

            if (string.IsNullOrWhiteSpace(_options.ApiBearerToken))
                return null;

            if (_cache.TryGetValue(CacheKey, out SepayBankAccountInfo? cached) && cached != null)
                return cached;

            try
            {
                using var request = new HttpRequestMessage(
                    HttpMethod.Get,
                    "https://userapi.sepay.vn/v2/bank-accounts?active=1&per_page=1");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiBearerToken);

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("SePay bank-accounts API returned {StatusCode}", response.StatusCode);
                    return null;
                }

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
                    return null;

                var first = data.EnumerateArray().FirstOrDefault();
                if (first.ValueKind == JsonValueKind.Undefined)
                    return null;

                var account = new SepayBankAccountInfo
                {
                    AccountNumber = first.GetProperty("account_number").GetString() ?? string.Empty,
                    BankName = first.TryGetProperty("bank_short_name", out var shortName)
                        ? shortName.GetString() ?? string.Empty
                        : first.GetProperty("bank_full_name").GetString() ?? string.Empty,
                    AccountHolder = first.GetProperty("account_holder_name").GetString() ?? string.Empty
                };

                if (string.IsNullOrWhiteSpace(account.AccountNumber) || string.IsNullOrWhiteSpace(account.BankName))
                    return null;

                _cache.Set(CacheKey, account, CacheDuration);
                return account;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to resolve SePay bank account from API");
                return null;
            }
        }
    }
}
