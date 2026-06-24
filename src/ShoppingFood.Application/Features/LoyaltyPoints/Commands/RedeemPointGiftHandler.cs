using FirebaseAdmin.Auth;
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

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class RedeemPointGiftHandler : IRequestHandler<RedeemPointGiftCommand, ApiResponse>
    {
        private readonly IPointGiftConfigRepository _pointGiftConfigRepository;
        private readonly ILoyaltyPointRepository _loyaltyPointRepository;
        private readonly ILoyaltyPointHistoryRepository _historyRepository;
        private readonly ICustomerDiscountRepository _customerDiscountRepository;
        private readonly IDiscountRepository _discountRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RedeemPointGiftHandler(
            IPointGiftConfigRepository pointGiftConfigRepository,
            ILoyaltyPointRepository loyaltyPointRepository,
            ILoyaltyPointHistoryRepository historyRepository,
            ICustomerDiscountRepository customerDiscountRepository,
            IDiscountRepository discountRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork)
        {
            _pointGiftConfigRepository = pointGiftConfigRepository;
            _loyaltyPointRepository = loyaltyPointRepository;
            _historyRepository = historyRepository;
            _customerDiscountRepository = customerDiscountRepository;
            _discountRepository = discountRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(RedeemPointGiftCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var configs = await _pointGiftConfigRepository.GetAsync(
                predicate: p => p.Id == request.PointGiftConfigId && !p.IsDeleted,
                include: q => q.Include(p => p.Discount),
                disableTracking: false
                );
            var config = configs.FirstOrDefault();
            if (config == null || !config.IsActive)
                return ApiResponse.Failure(404, "Point gift config not found or is inactive.");

            var discount = config.Discount;
            if (discount == null || discount.IsDeleted || discount.Status != Domain.Enums.DiscountStatus.Active)
                return ApiResponse.Failure(400, "The associated voucher is currently unavailable.");

            var now = DateTime.UtcNow;
            if (now < discount.StartDate || now > discount.EndDate)
                return ApiResponse.Failure(400, "The associated voucher has expired or is not yet active.");

            if (discount.UsedCount >= discount.Quantity)
                return ApiResponse.Failure(400, "Voucher has run out of usage.");

            var loyaltyPoint = (await _loyaltyPointRepository.GetAsync(
                predicate: l => l.UserAccountId == request.CurrentUserId.Value,
                disableTracking: false
                )).FirstOrDefault();

            if (loyaltyPoint == null || loyaltyPoint.PointsBalance < config.PointRequired)
                return ApiResponse.Failure(400, "Insufficient points balance.");

            var customerDiscounts = await _customerDiscountRepository.GetAsync(
                predicate: cd => cd.UserAccountId == request.CurrentUserId.Value && cd.DiscountId == discount.Id,
                disableTracking: true
                );
            if (customerDiscounts.Any())
                return ApiResponse.Failure(400, "This discount code is already saved in your wallet.");

            ProcessLoyaltyPointsDeduction(loyaltyPoint, config.PointRequired, now);

            AddLoyaltyPointHistory(request.CurrentUserId.Value, config.PointRequired, discount, now);

            var customerDiscountId = SaveDiscountToWaller(request.CurrentUserId.Value, discount.Id, now);

            SendRedeemNotification(request.CurrentUserId.Value, config.PointRequired, discount, now);

            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(customerDiscountId, "Redeemed points for voucher successfully.");
        }

        private void SendRedeemNotification(Guid userId, int pointRequired, Discount discount, DateTime now)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = "Đổi voucher thành công",
                Message = $"Chúc mừng! Bạn đã đổi thành công {pointRequired} điểm tích lũy lấy mã giảm giá: {discount.Title} ({discount.Code}). Hãy kiểm tra kho lưu trữ voucher của bạn ngay!",
                NotificationType = null,
                IsRead = false,
                CreateAt = now
            };
            _notificationRepository.Add(notification);
        }

        private void AddLoyaltyPointHistory(Guid userId, int pointRequired, Discount discount, DateTime now)
        {
            var history = new LoyaltyPointHistory
            {
                Id = Guid.NewGuid(),
                UserAccountId = userId,
                Points = -pointRequired,
                TransactionType = Domain.Enums.PointTransactionType.RedeemVoucher,
                Description = $"Redeemed {pointRequired} points for voucher: {discount.Title} ({discount.Code})",
                CreatedAt = now
            };
            _historyRepository.Add(history);
        }

        private Guid SaveDiscountToWaller(Guid userId, Guid discountId, DateTime now)
        {
            var customerDiscount = new CustomerDiscount
            {
                Id = Guid.NewGuid(),
                UserAccountId = userId,
                DiscountId = discountId,
                UsageCount = 0,
                SavedAt = now,
                UpdatedAt = now
            };
            _customerDiscountRepository.Add(customerDiscount);
            return customerDiscount.Id;
        }

        

        private void ProcessLoyaltyPointsDeduction(LoyaltyPoint loyaltyPoint, int pointRequired, DateTime now)
        {
            loyaltyPoint.PointsBalance -= pointRequired;
            loyaltyPoint.UpdatedAt = now;
            _loyaltyPointRepository.Update(loyaltyPoint);
        }
    }
}
