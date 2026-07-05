using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetChatHistoryHandler : IRequestHandler<GetChatHistoryQuery, ApiResponse>
    {
        private readonly IChatMessageRepository _chatMessageRepository;

        public GetChatHistoryHandler(
            IChatMessageRepository chatMessageRepository)
        {
            _chatMessageRepository = chatMessageRepository;
        }

        public async Task<ApiResponse> Handle(GetChatHistoryQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var messages = await _chatMessageRepository.GetAsync(
                predicate: m => m.SessionId == request.SessionId,
                orderBy: q => q.OrderBy(m => m.CreatedAt),
                disableTracking: true
                );

            var dtos = messages.Select(m => new
            {
                Id = m.Id,
                SessionId = m.SessionId,
                SenderId = m.SenderId,
                SenderRole = m.SenderRole.ToString(),
                Content = m.Content,
                CreatedAt = m.CreatedAt
            }).ToList();

            return ApiResponse.Success(dtos, "Chat history retrieved.");
        }
    }
}
