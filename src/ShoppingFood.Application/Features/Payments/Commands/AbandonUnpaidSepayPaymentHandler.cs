using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Services;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Payments.Commands
{
    public class AbandonUnpaidSepayPaymentHandler : IRequestHandler<AbandonUnpaidSepayPaymentCommand, ApiResponse>
    {
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IPaymentCacheService _paymentCache;
        private readonly ChatSessionCloseService _chatSessionCloseService;
        private readonly IUnitOfWork _unitOfWork;

        public AbandonUnpaidSepayPaymentHandler(
            IPaymentSessionRepository sessionRepository,
            IOrderRepository orderRepository,
            IPaymentCacheService paymentCache,
            ChatSessionCloseService chatSessionCloseService,
            IUnitOfWork unitOfWork)
        {
            _sessionRepository = sessionRepository;
            _orderRepository = orderRepository;
            _paymentCache = paymentCache;
            _chatSessionCloseService = chatSessionCloseService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(AbandonUnpaidSepayPaymentCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var sessions = await _sessionRepository.GetAsync(
                predicate: s => s.Id == request.SessionId,
                disableTracking: false);
            var session = sessions.FirstOrDefault();
            if (session == null)
                return ApiResponse.Failure(404, "Không tìm thấy phiên thanh toán.");

            if (session.UserAccountId != request.CurrentUserId.Value)
                return ApiResponse.Failure(403, "Bạn không có quyền hủy phiên thanh toán này.");

            if (session.PaymentMethod != PaymentMethod.Sepay)
                return ApiResponse.Failure(400, "Chỉ áp dụng cho thanh toán SePay.");

            // Đã nhận tiền qua webhook — không được hủy
            if (PaymentSessionStatusHelper.IsWebhookConfirmed(session))
            {
                return ApiResponse.Success(new
                {
                    abandoned = false,
                    alreadyPaid = true,
                    sessionId = session.Id,
                    orderId = session.OrderId,
                    status = session.Status.ToString()
                }, "Thanh toán đã được xác nhận — không hủy đơn.");
            }

            // Top-up ví (không gắn đơn) — chỉ hết hạn session
            if (!session.OrderId.HasValue)
            {
                if (session.Status == PaymentSessionStatus.Pending)
                {
                    session.Status = PaymentSessionStatus.Expired;
                    session.UpdatedAt = DateTime.UtcNow;
                    _sessionRepository.Update(session);
                    _paymentCache.UpdateStatus(session.Id, "Expired");
                    await _unitOfWork.SaveChangesAsync();
                }

                return ApiResponse.Success(new
                {
                    abandoned = true,
                    alreadyPaid = false,
                    sessionId = session.Id,
                    orderId = (Guid?)null
                }, "Đã hủy phiên nạp tiền.");
            }

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Id == session.OrderId.Value,
                disableTracking: false);
            var order = orders.FirstOrDefault();
            if (order == null)
                return ApiResponse.Failure(404, "Không tìm thấy đơn hàng gắn phiên thanh toán.");

            // Idempotent: đã hủy / đã thanh toán
            if (order.PaymentStatus == PaymentStatus.Paid || order.Status == OrderStatus.Delivered)
            {
                return ApiResponse.Success(new
                {
                    abandoned = false,
                    alreadyPaid = true,
                    sessionId = session.Id,
                    orderId = order.Id,
                    status = order.Status.ToString()
                }, "Đơn đã thanh toán — không hủy.");
            }

            if (order.Status == OrderStatus.Cancelled
                && (order.PaymentStatus == PaymentStatus.Failed || order.PaymentStatus == PaymentStatus.Pending))
            {
                EnsureSessionExpired(session);
                await _unitOfWork.SaveChangesAsync();
                return ApiResponse.Success(new
                {
                    abandoned = true,
                    alreadyPaid = false,
                    sessionId = session.Id,
                    orderId = order.Id,
                    status = order.Status.ToString()
                }, "Đơn đã được hủy trước đó.");
            }

            // Chỉ hủy khi đơn còn Pending và chưa trả tiền
            if (order.Status != OrderStatus.Pending || order.PaymentStatus != PaymentStatus.Pending)
            {
                return ApiResponse.Failure(400,
                    $"Không thể hủy đơn ở trạng thái hiện tại (Status={order.Status}, Payment={order.PaymentStatus}).");
            }

            order.Status = OrderStatus.Cancelled;
            order.PaymentStatus = PaymentStatus.Failed;
            order.RejectReason = "[Payment Abandoned] Khách đóng QR / hủy thanh toán SePay khi chưa chuyển khoản.";
            order.UpdatedAt = DateTime.UtcNow;
            _orderRepository.Update(order);

            EnsureSessionExpired(session);
            await _unitOfWork.SaveChangesAsync();

            await _chatSessionCloseService.CloseSessionsForCancelledOrderAsync(order.Id);

            return ApiResponse.Success(new
            {
                abandoned = true,
                alreadyPaid = false,
                sessionId = session.Id,
                orderId = order.Id,
                status = order.Status.ToString()
            }, "Đã hủy đơn vì chưa thanh toán SePay.");
        }

        private void EnsureSessionExpired(PaymentSession session)
        {
            if (session.Status == PaymentSessionStatus.Completed)
                return;

            session.Status = PaymentSessionStatus.Expired;
            session.UpdatedAt = DateTime.UtcNow;
            _sessionRepository.Update(session);
            _paymentCache.UpdateStatus(session.Id, "Expired");
        }
    }
}
