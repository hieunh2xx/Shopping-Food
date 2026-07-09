using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Chat.Queries
{
    public class GetUserSessionsQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
    }

    public class GetUserSessionsHandler : IRequestHandler<GetUserSessionsQuery, ApiResponse>
    {
        private readonly IChatSessionRepository _chatSessionRepository;

        public GetUserSessionsHandler(IChatSessionRepository chatSessionRepository)
        {
            _chatSessionRepository = chatSessionRepository;
        }

        public async Task<ApiResponse> Handle(GetUserSessionsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            // Get all support sessions created by this user
            var sessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.UserId == request.CurrentUserId.Value && s.RestaurantId == null,
                orderBy: q => q.OrderByDescending(s => s.CreatedAt),
                disableTracking: true
            );

            var result = sessions.Select(s => new
            {
                Id = s.Id,
                UserId = s.UserId,
                SupportId = s.SupportId,
                Topic = s.Topic.ToString(),
                Status = s.Status.ToString(),
                CreatedAt = s.CreatedAt,
                ClosedAt = s.ClosedAt
            }).ToList();

            return ApiResponse.Success(result, "Retrieved user chat sessions successfully.");
        }
    }
}
