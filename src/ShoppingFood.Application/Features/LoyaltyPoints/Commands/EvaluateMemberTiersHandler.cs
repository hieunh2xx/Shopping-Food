using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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
            foreach(var lp in loyaltyPointsList)
            {
                var oldTier = lp.Tier;
                var newTier = DetermineMemberTier(lp.TotalEarnedPoints, tiers);

                lp.Tier = newTier;
                lp.TotalEarnedPoints = 0;
                lp.UpdatedAt = DateTime.UtcNow;
                _loyaltyPointRepository.Update(lp);

                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = lp.UserAccountId,
                    Title = "Đánh giá xếp hạng thành viên định kỳ",
                    Message = $"Hệ thống đã cập nhật hạng thành viên của bạn cho chu kỳ mới. Hạng cũ: {oldTier} -> Hạng mới: {newTier}.",
                    NotificationType = NotificationType.Loyalty,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                };
                _notificationRepository.Add(notification);
                updatedCount++;
            }

            if(updatedCount > 0) await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(updatedCount, $"Successfully evaluated periodic member tier for {updatedCount} users.");
        }

        private MemberTier DetermineMemberTier(int totalEarnedPoints, List<MemberTierConfig> tiers)
        {
            var diamondMin = tiers.FirstOrDefault(c => c.Tier == MemberTier.Diamond)?.MinPoints ?? 1000;
            var goldMin = tiers.FirstOrDefault(c => c.Tier == MemberTier.Gold)?.MinPoints ?? 500;
            var silverMin = tiers.FirstOrDefault(c => c.Tier == MemberTier.Silver)?.MinPoints ?? 100;
            if (totalEarnedPoints >= diamondMin) return MemberTier.Diamond;
            if (totalEarnedPoints >= goldMin) return MemberTier.Gold;
            if (totalEarnedPoints >= silverMin) return MemberTier.Silver;
            return MemberTier.Bronze;
        }
    }
}
