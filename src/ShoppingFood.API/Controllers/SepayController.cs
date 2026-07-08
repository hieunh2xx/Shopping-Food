using System.Text;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ShoppingFood.Application.Features.Payments.Commands;
using ShoppingFood.Application.Options;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Security;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.API.Controllers
{
    [ApiController]
    [Route("api/Payment/sepay")]
    public class SepayController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly SepayOptions _sepayOptions;
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly ILogger<SepayController> _logger;

        public SepayController(
            IMediator mediator,
            IOptions<SepayOptions> sepayOptions,
            IPaymentSessionRepository sessionRepository,
            ILogger<SepayController> logger)
        {
            _mediator = mediator;
            _sepayOptions = sepayOptions.Value;
            _sessionRepository = sessionRepository;
            _logger = logger;
        }

        /// <summary>QR VietQR — URL sinh từ backend, frontend chỉ hiển thị ảnh.</summary>
        [HttpGet("qr/{sessionId:guid}")]
        public async Task<IActionResult> GetQr(Guid sessionId)
        {
            var userId = (User as MyPrincipal)?.UserDto?.Id;
            var response = await _mediator.Send(new GetSepayQrQuery
            {
                SessionId = sessionId,
                CurrentUserId = userId
            });
            return StatusCode(response.Code, response);
        }

        [HttpGet("checkout/{sessionId:guid}")]
        public async Task<IActionResult> GetCheckout(Guid sessionId, [FromQuery] string? paymentMethod = null)
        {
            var userId = (User as MyPrincipal)?.UserDto?.Id;
            var response = await _mediator.Send(new GetSepayCheckoutQuery
            {
                SessionId = sessionId,
                CurrentUserId = userId,
                PaymentMethod = paymentMethod
            });
            return StatusCode(response.Code, response);
        }

        [HttpGet("session/status")]
        public async Task<IActionResult> GetSessionStatus(
            [FromQuery] Guid? sessionId,
            [FromQuery] string? invoiceNumber)
        {
            var userId = (User as MyPrincipal)?.UserDto?.Id;
            var response = await _mediator.Send(new GetPaymentSessionStatusQuery
            {
                SessionId = sessionId,
                InvoiceNumber = invoiceNumber,
                CurrentUserId = userId
            });
            return StatusCode(response.Code, response);
        }

        [HttpGet("ipn")]
        [HttpHead("ipn")]
        public IActionResult IpnHealthCheck()
        {
            return Ok(new { success = true, message = "SePay IPN endpoint ready. SePay must POST JSON here." });
        }

        [HttpPost("ipn")]
        public async Task<IActionResult> Ipn()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var response = await _mediator.Send(new ProcessSepayIpnCommand
            {
                RawBody = body,
                SecretHeader = Request.Headers["X-Secret-Key"].FirstOrDefault()
            });
            if (response.Code is 200 or 201) return Ok(new { success = true });
            return StatusCode(response.Code, response);
        }

        [HttpGet("webhook/diagnostics")]
        public async Task<IActionResult> WebhookDiagnostics()
        {
            var hmacEnabled = !string.IsNullOrWhiteSpace(_sepayOptions.WebhookSecret);
            var apiKeyEnabled = !string.IsNullOrWhiteSpace(_sepayOptions.WebhookApiKey);

            var pendingSessions = await _sessionRepository.GetAsync(
                predicate: s => s.Status == PaymentSessionStatus.Pending
                    && s.PaymentMethod == PaymentMethod.Sepay
                    && s.ExpiresAt > DateTime.UtcNow,
                orderBy: q => q.OrderByDescending(s => s.CreatedAt),
                disableTracking: true);

            return Ok(new
            {
                success = true,
                webhookUrl = $"{Request.Scheme}://{Request.Host}/api/Payment/sepay/webhook",
                hmacEnabled,
                apiKeyEnabled,
                authMode = hmacEnabled ? "HMAC-SHA256" : apiKeyEnabled ? "API Key" : "none",
                paymentCodePrefix = _sepayOptions.PaymentCodePrefix,
                vietQrKeyword = _sepayOptions.VietQrTransferKeyword,
                bankAccount = _sepayOptions.BankAccountNumber,
                bankName = _sepayOptions.BankName,
                pendingSepaySessions = pendingSessions.Take(5).Select(s => new
                {
                    sessionId = s.Id,
                    invoiceNumber = s.InvoiceNumber,
                    amount = s.Amount,
                    transferContent = s.InvoiceNumber != null
                        ? $"{_sepayOptions.VietQrTransferKeyword} {s.InvoiceNumber}".Trim()
                        : null,
                    expiresAt = s.ExpiresAt,
                    remainingSeconds = Math.Max(0, (int)(s.ExpiresAt - DateTime.UtcNow).TotalSeconds)
                }),
                sepayDashboardWebhookUrl = "https://modulator-vowed-embark.ngrok-free.dev/api/Payment/sepay/webhook",
                note = "Dat hang SePay truoc, roi CK dung invoice+amount trong pendingSepaySessions. SePay chi gui webhook khi co GD that tren TK da chon."
            });
        }

        [HttpPost("reconcile")]
        public async Task<IActionResult> Reconcile(
            [FromQuery] Guid? sessionId,
            [FromQuery] string? invoiceNumber)
        {
            var userId = (User as MyPrincipal)?.UserDto?.Id;
            var response = await _mediator.Send(new ReconcileSepayPaymentCommand
            {
                SessionId = sessionId,
                InvoiceNumber = invoiceNumber,
                CurrentUserId = userId
            });
            return StatusCode(response.Code, response);
        }

        [HttpGet("webhook")]
        [HttpHead("webhook")]
        public IActionResult WebhookHealthCheck()
        {
            return Ok(new { success = true, message = "SePay webhook endpoint ready. SePay must POST JSON here." });
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> BankWebhook()
        {
            Request.EnableBuffering();
            using var reader = new StreamReader(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            Request.Body.Position = 0;

            var signature = Request.Headers["X-SePay-Signature"].FirstOrDefault()
                ?? Request.Headers["x-sepay-signature"].FirstOrDefault();
            var timestamp = Request.Headers["X-SePay-Timestamp"].FirstOrDefault()
                ?? Request.Headers["x-sepay-timestamp"].FirstOrDefault();

            var response = await _mediator.Send(new ProcessSepayBankWebhookCommand
            {
                RawBody = body,
                AuthorizationHeader = Request.Headers.Authorization.FirstOrDefault(),
                SignatureHeader = signature,
                TimestampHeader = timestamp
            });

            _logger.LogInformation(
                "SePay webhook POST from {RemoteIp}: status={StatusCode}, hasSignature={HasSig}, bodyLength={Len}",
                HttpContext.Connection.RemoteIpAddress,
                response.Code,
                !string.IsNullOrEmpty(signature),
                body.Length);

            if (response.Code is 200 or 201) return Ok(new { success = true });
            return StatusCode(response.Code, response);
        }
    }
}
