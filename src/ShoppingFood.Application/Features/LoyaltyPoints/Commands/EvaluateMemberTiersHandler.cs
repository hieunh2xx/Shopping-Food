using MediatR;
using ShoppingFood.Application.Common;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class EvaluateMemberTiersHandler : IRequestHandler<EvaluateMemberTiersCommand, ApiResponse>
    {
        private readonly ILoyaltyPointRepository _loyaltyPointRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IMemberTierConfigRepository _memberTierConfigRepository;
        private readonly IUnitOfWork _unitOfWork;

        public EvaluateMemberTiersHandler(
            ILoyaltyPointRepository loyaltyPointRepository,
            INotificationRepository notificationRepository,
            IMemberTierConfigRepository memberTierConfigRepository,
            IUnitOfWork unitOfWork)
        {
            _loyaltyPointRepository = loyaltyPointRepository;
            _notificationRepository = notificationRepository;
            _memberTierConfigRepository = memberTierConfigRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(EvaluateMemberTiersCommand request, CancellationToken cancellationToken)
        {
            var tiers = (await _memberTierConfigRepository.GetAsync()).ToList();
            var loyaltyPointsList = await _loyaltyPointRepository.GetAsync(disableTracking: false);

            int updatedCount = 0;
            foreach (var lp in loyaltyPointsList)
            {
                var oldTier = lp.Tier;
                var newTier = MemberTierHelper.Determine(lp.TotalEarnedPoints, tiers);

                lp.Tier = newTier;
                lp.TotalEarnedPoints = 0; // reset chu kỳ đánh giá định kỳ
                lp.UpdatedAt = DateTime.UtcNow;
                _loyaltyPointRepository.Update(lp);

                var oldLabel = MemberTierHelper.ToVietnamese(oldTier);
                var newLabel = MemberTierHelper.ToVietnamese(newTier);

                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = lp.UserAccountId,
                Title = "Hạng thành viên đã cập nhật",
                Message = $"Hạng thành viên của bạn đã được điều chỉnh theo chu kỳ mới: {oldLabel} → {newLabel}. Xem quyền lợi hạng trong mục Thành viên.",
                    NotificationType = NotificationType.Loyalty,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                };
                _notificationRepository.Add(notification);
                updatedCount++;
            }

            if (updatedCount > 0) await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(updatedCount, $"Successfully evaluated periodic member tier for {updatedCount} users.");
        }
    }
}
