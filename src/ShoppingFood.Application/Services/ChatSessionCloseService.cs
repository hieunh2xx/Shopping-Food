using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Services
{
    /// <summary>
    /// Đóng phiên chat liên quan đến đơn hàng khi đơn bị hủy hoặc đã giao quá 24 giờ.
    /// </summary>
    public class ChatSessionCloseService
    {
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ChatSessionCloseService(
            IChatSessionRepository chatSessionRepository,
            IUnitOfWork unitOfWork)
        {
            _chatSessionRepository = chatSessionRepository;
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// Đóng ngay tất cả session đang Open của một đơn hàng.
        /// Gọi khi đơn bị hủy.
        /// </summary>
        public async Task CloseSessionsForCancelledOrderAsync(Guid orderId)
        {
            await CloseOpenSessionsAsync(orderId);
        }

        /// <summary>
        /// Đóng session nếu đơn đã giao và đã quá 24 giờ.
        /// Gọi sau khi xác nhận giao thành công (để chạy background check).
        /// </summary>
        public async Task CloseSessionsForDeliveredOrderIfExpiredAsync(Guid orderId, DateTime deliveredAt)
        {
            if (deliveredAt.AddHours(24) <= DateTime.UtcNow)
            {
                await CloseOpenSessionsAsync(orderId);
            }
        }

        private async Task CloseOpenSessionsAsync(Guid orderId)
        {
            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.OrderId == orderId && s.Status == ChatSessionStatus.Open,
                disableTracking: false);

            foreach (var session in sessions)
            {
                session.Status = ChatSessionStatus.Closed;
                session.ClosedAt = DateTime.UtcNow;
                _chatSessionRepository.Update(session);
            }

            if (sessions.Any())
                await _unitOfWork.SaveChangesAsync();
        }
    }
}
