using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetCurrentSessionHandler : IRequestHandler<GetCurrentSessionQuery, ApiResponse>
    {
        private readonly IChatSessionRepository _chatSessionRepository;

        public GetCurrentSessionHandler(IChatSessionRepository chatSessionRepository)
        {
            _chatSessionRepository = chatSessionRepository;
        }

        public async Task<ApiResponse> Handle(GetCurrentSessionQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var existingSessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.UserId == request.CurrentUserId.Value && s.Status == Domain.Enums.ChatSessionStatus.Open,
                include: q => q.Include(s => s.Messages),
                disableTracking: true
            );
            var existingSession = existingSessions.FirstOrDefault();
            if (existingSession != null)
            {
                var result = new {
                    Id = existingSession.Id,
                    UserId = existingSession.UserId,
                    SupportId = existingSession.SupportId,
                    Topic = existingSession.Topic.ToString(),
                    Status = existingSession.Status.ToString(),
                    CreatedAt = existingSession.CreatedAt,
                    ClosedAt = existingSession.ClosedAt,
                    Messages = existingSession.Messages.OrderBy(m => m.CreatedAt).Select(m => new {
                        Id = m.Id,
                        SessionId = m.SessionId,
                        SenderId = m.SenderId,
                        SenderRole = m.SenderRole.ToString(),
                        Content = m.Content,
                        CreatedAt = m.CreatedAt
                    }).ToList()
                };
                return ApiResponse.Success(result, "Found existing open session.");
            }

            return ApiResponse.Success(null, "No open session found.");
        }
    }
}
