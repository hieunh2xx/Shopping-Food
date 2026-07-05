using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetOpenSessionsHandler : IRequestHandler<GetOpenSessionsQuery, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IChatSessionRepository _chatSessionRepository;

        public GetOpenSessionsHandler(
            IUserRepository userRepository,
            IChatSessionRepository chatSessionRepository)
        {
            _userRepository = userRepository;
            _chatSessionRepository = chatSessionRepository;
        }

        public async Task<ApiResponse> Handle(GetOpenSessionsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            
            if (userProfile == null || (userProfile.Role != Domain.Enums.UserRole.Admin && userProfile.Role != Domain.Enums.UserRole.Coordinator))
                return ApiResponse.Failure(403, "Forbidden. Only Admin or Coordinator can view open sessions.");

            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.Status == Domain.Enums.ChatSessionStatus.Open,
                include: q => q.Include(s => s.Messages),
                disableTracking: true
                );

            var result = sessions.OrderByDescending(s => s.CreatedAt).Select(s => new {
                Id = s.Id,
                UserId = s.UserId,
                SupportId = s.SupportId,
                Topic = s.Topic.ToString(),
                Status = s.Status.ToString(),
                CreatedAt = s.CreatedAt,
                ClosedAt = s.ClosedAt,
                Messages = s.Messages.OrderBy(m => m.CreatedAt).Select(m => new {
                    Id = m.Id,
                    SessionId = m.SessionId,
                    SenderId = m.SenderId,
                    SenderRole = m.SenderRole.ToString(),
                    Content = m.Content,
                    CreatedAt = m.CreatedAt
                }).ToList()
            }).ToList();

            return ApiResponse.Success(result, "Retrieved open chat sessions successfully.");
        }
    }
}
