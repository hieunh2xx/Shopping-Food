using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Chat.Commands
{
    public class ClaimChatSessionHandler : IRequestHandler<ClaimChatSessionCommand, ApiResponse>
    {
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ClaimChatSessionHandler(IChatSessionRepository chatSessionRepository, IUnitOfWork unitOfWork)
        {
            _chatSessionRepository = chatSessionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ClaimChatSessionCommand request, CancellationToken cancellationToken)
        {
            var session = await _chatSessionRepository.GetByIdAsync(request.SessionId);
            if (session == null)
                return ApiResponse.Failure(404, "Chat session not found.");

            if (session.SupportId.HasValue)
                return ApiResponse.Failure(400, "Session is already claimed by another support member.");

            var supportIdToAssign = request.SupportId != Guid.Empty ? request.SupportId : request.CurrentUserId;
            if (!supportIdToAssign.HasValue || supportIdToAssign.Value == Guid.Empty)
                return ApiResponse.Failure(400, "Support ID is required.");

            session.SupportId = supportIdToAssign.Value;
            _chatSessionRepository.Update(session);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Session claimed successfully.");
        }
    }
}
