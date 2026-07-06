using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class AdjustShipperReputationHandler : IRequestHandler<AdjustShipperReputationCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperProfileRepository;
        private readonly IShipperReputationHistoryRepository _reputationHistoryRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AdjustShipperReputationHandler(
            IShipperProfileRepository shipperProfileRepository,
            IShipperReputationHistoryRepository reputationHistoryRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _shipperProfileRepository = shipperProfileRepository;
            _reputationHistoryRepository = reputationHistoryRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(AdjustShipperReputationCommand request, CancellationToken cancellationToken)
        {
            if (request.Points == 0)
                return ApiResponse.Failure(400, "Points change cannot be zero.");

            var shippers = await _shipperProfileRepository.GetAsync(
                predicate: s => s.Id == request.ShipperId,
                include: q => q.Include(s => s.UserProfile),
                disableTracking: false
            );
            var shipper = shippers.FirstOrDefault();

            if (shipper == null)
                return ApiResponse.Failure(404, "Shipper not found.");

            // Update reputation score
            var oldScore = shipper.ReputationScore;
            shipper.ReputationScore += request.Points;

            // Constrain between 0 and 100
            if (shipper.ReputationScore > 100) shipper.ReputationScore = 100;
            if (shipper.ReputationScore < 0) shipper.ReputationScore = 0;

            var actualChange = shipper.ReputationScore - oldScore;

            _shipperProfileRepository.Update(shipper);

            // Add history record using the requested points
            var history = new ShipperReputationHistory
            {
                Id = Guid.NewGuid(),
                ShipperProfileId = shipper.Id,
                PointChange = request.Points,
                Reason = string.IsNullOrWhiteSpace(request.Reason) ? "Điều phối viên thay đổi thủ công" : request.Reason,
                CreatedAt = DateTime.UtcNow
            };
            _reputationHistoryRepository.Add(history);

            // Send notification to shipper
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = shipper.UserProfile.UserAccountId,
                Title = request.Points > 0 ? "Bạn được cộng điểm uy tín" : "Bạn đã bị trừ điểm uy tín",
                Message = request.Points > 0
                    ? $"Bạn vừa được cộng {request.Points} điểm uy tín. Lý do: {history.Reason}. Điểm hiện tại: {shipper.ReputationScore}."
                    : $"Bạn vừa bị trừ {-request.Points} điểm uy tín. Lý do: {history.Reason}. Điểm hiện tại: {shipper.ReputationScore}.",
                NotificationType = NotificationType.System,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(notification);

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(shipper.ReputationScore, "Reputation score adjusted successfully.");
        }
    }
}
