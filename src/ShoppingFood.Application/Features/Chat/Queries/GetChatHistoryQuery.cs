using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetChatHistoryQuery : BaseQuery, IRequest<ApiResponse>
    {
        public Guid SessionId { get; set; }
        /// <summary>Số tin mỗi trang (mặc định 20).</summary>
        public int Take { get; set; } = 20;
        /// <summary>Lấy tin cũ hơn mốc này (CreatedAt UTC). Null = trang mới nhất.</summary>
        public DateTime? Before { get; set; }
    }
}
