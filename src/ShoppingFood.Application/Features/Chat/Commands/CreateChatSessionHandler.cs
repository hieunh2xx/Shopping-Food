using MediatR; 
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Chat.Commands
{
    public class CreateChatSessionHandler : IRequestHandler<CreateChatSessionCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateChatSessionHandler(
            IUserRepository userRepository,
            IChatSessionRepository chatSessionRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _chatSessionRepository = chatSessionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(CreateChatSessionCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null ||
                (userProfile.Role != Domain.Enums.UserRole.Customer &&
                userProfile.Role != Domain.Enums.UserRole.Seller &&
                userProfile.Role != Domain.Enums.UserRole.Mall &&
                userProfile.Role != Domain.Enums.UserRole.Shipper))
                return ApiResponse.Failure(403, "Forbidden.");

            var existingSessions = await _chatSessionRepository.GetAsync(
                predicate: s => s.UserId == request.CurrentUserId.Value && s.Status == Domain.Enums.ChatSessionStatus.Open,
                include: q => q.Include(s => s.Messages)
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

            var session = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = request.CurrentUserId.Value,
                Topic = request.Topic,
                Status = Domain.Enums.ChatSessionStatus.Open,
                CreatedAt = DateTime.UtcNow,
            };
            _chatSessionRepository.Add(session);
            await _unitOfWork.SaveChangesAsync();

            var newSessionResult = new {
                Id = session.Id,
                UserId = session.UserId,
                SupportId = session.SupportId,
                Topic = session.Topic.ToString(),
                Status = session.Status.ToString(),
                CreatedAt = session.CreatedAt,
                ClosedAt = session.ClosedAt,
                Messages = new List<object>()
            };

            return ApiResponse.Success(newSessionResult, "Chat session created successfully.");
        }
    }
}
