using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Notification;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Notifications.Queries
{
    public class GetNotificationsHandler : IRequestHandler<GetNotificationsQuery, ApiResponse>
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IMapper _mapper;

        public GetNotificationsHandler(INotificationRepository notificationRepository, IMapper mapper)
        {
            _notificationRepository = notificationRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var notifications = await _notificationRepository.GetAsync(
                predicate: n => n.UserId == request.CurrentUserId.Value,
                orderBy: q => q.OrderByDescending(n => n.CreateAt),
                disableTracking: true
            );

            var dtos = _mapper.Map<List<NotificationDto>>(notifications);
            return ApiResponse.Success(dtos, "Notifications retrieved successfully.");
        }
    }
}
