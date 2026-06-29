using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Notifications.Commands
{
    public class MarkAllNotificationsReadHandler : IRequestHandler<MarkAllNotificationsReadCommand, ApiResponse>
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public MarkAllNotificationsReadHandler(INotificationRepository notificationRepository, IUnitOfWork unitOfWork)
        {
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(MarkAllNotificationsReadCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var unreadNotifications = await _notificationRepository.GetAsync(
                predicate: n => n.UserId == request.CurrentUserId.Value && !n.IsRead,
                disableTracking: false
            );

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                _notificationRepository.Update(notification);
            }

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "All notifications marked as read successfully.");
        }
    }
}
