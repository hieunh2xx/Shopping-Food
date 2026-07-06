using Microsoft.AspNetCore.Mvc;
using MediatR;
using ShoppingFood.Application.Features.Payments.Commands;
using ShoppingFood.Application.Features.Payments.Queries;
namespace ShoppingFood.API.Controllers
{
    public class PaymentController : CommonController
    {
        public PaymentController(IMediator mediator) : base(mediator) { }

        [HttpGet("methods")]
        public async Task<IActionResult> GetPaymentMethods()
        {
            var response = await _mediator.Send(new GetPaymentMethodsQuery());
            return StatusCode(response.Code, response);
        }

        [HttpGet("wallet")]
        public async Task<IActionResult> GetWallet([FromQuery] GetWalletQuery query)
        {
            query.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("wallet/top-up")]
        public async Task<IActionResult> TopUpWallet([FromBody] TopUpWalletCommand command)
        {
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentSessionCommand command)
        {
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("withdraw")]
        public async Task<IActionResult> RequestWithdrawal([FromBody] RequestWithdrawalCommand command)
        {
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("withdrawals")]
        public async Task<IActionResult> GetWithdrawals([FromQuery] GetWithdrawalsQuery query)
        {
            query.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("withdrawals/approve")]
        public async Task<IActionResult> ApproveWithdrawal([FromBody] ApproveWithdrawalCommand command)
        {
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] GetTransactionsQuery query)
        {
            query.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpPost("invoice")]
        public async Task<IActionResult> RequestInvoice([FromBody] RequestInvoiceCommand command)
        {
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPost("shipper/repay-debt")]
        public async Task<IActionResult> RepayShipperDebt([FromBody] RepayShipperDebtCommand command)
        {
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpPut("shipper/debt-limit")]
        public async Task<IActionResult> UpdateShipperDebtLimit([FromBody] UpdateShipperDebtLimitCommand command)
        {
            command.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(command);
            return StatusCode(response.Code, response);
        }

        [HttpGet("reconciliation")]
        public async Task<IActionResult> GetReconciliation([FromQuery] GetReconciliationReportQuery query)
        {
            query.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetPaymentHistory([FromQuery] GetPaymentHistoryQuery query)
        {
            query.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetPaymentDashboard([FromQuery] GetPaymentDashboardQuery query)
        {
            query.CurrentUserId = userDto?.Id;
            var response = await _mediator.Send(query);
            return StatusCode(response.Code, response);
        }
    }
}
