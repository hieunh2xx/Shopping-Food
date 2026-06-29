using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Notifications.Commands
{
    public class MarkNotificationReadHandler : IRequestHandler<MarkNotificationReadCommand, ApiResponse>
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public MarkNotificationReadHandler(INotificationRepository notificationRepository, IUnitOfWork unitOfWork)
        {
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(MarkNotificationReadCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var notifications = await _notificationRepository.GetAsync(
                predicate: n => n.Id == request.NotificationId,
                disableTracking: false
            );
            var notification = notifications.FirstOrDefault();

            if (notification == null)
                return ApiResponse.Failure(404, "Notification not found.");

            if (notification.UserId != request.CurrentUserId.Value)
                return ApiResponse.Failure(403, "Access denied. You cannot read this notification.");

            notification.IsRead = true;
            _notificationRepository.Update(notification);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Notification marked as read successfully.");
        }
    }
}
