using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Payments.Commands
{
    /// <summary>Shipper gửi yêu cầu nộp COD — chưa trừ nợ cho đến khi được duyệt.</summary>
    public class RequestCodRemittanceCommand : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public decimal Amount { get; set; }
        public string? Note { get; set; }
        public string? ProofImageUrl { get; set; }
    }

    public class RequestCodRemittanceHandler : IRequestHandler<RequestCodRemittanceCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IUserRepository _userRepository;
        private readonly ICodRemittanceRequestRepository _remittanceRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationPushService _notificationPushService;
        private readonly IUnitOfWork _unitOfWork;

        public RequestCodRemittanceHandler(
            IShipperProfileRepository shipperRepository,
            IUserRepository userRepository,
            ICodRemittanceRequestRepository remittanceRepository,
            INotificationRepository notificationRepository,
            INotificationPushService notificationPushService,
            IUnitOfWork unitOfWork)
        {
            _shipperRepository = shipperRepository;
            _userRepository = userRepository;
            _remittanceRepository = remittanceRepository;
            _notificationRepository = notificationRepository;
            _notificationPushService = notificationPushService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(RequestCodRemittanceCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");
            if (request.Amount <= 0)
                return ApiResponse.Failure(400, "Số tiền không hợp lệ.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            var profile = users.FirstOrDefault()?.Profile;
            if (profile?.Role != UserRole.Shipper)
                return ApiResponse.Failure(403, "Chỉ tài xế mới được gửi yêu cầu nộp COD.");

            var shippers = await _shipperRepository.GetAsync(
                predicate: s => s.UserProfileId == profile.Id,
                disableTracking: true);
            var shipper = shippers.FirstOrDefault();
            if (shipper == null)
                return ApiResponse.Failure(404, "Không tìm thấy hồ sơ tài xế.");

            var pending = await _remittanceRepository.GetAsync(
                predicate: r => r.ShipperProfileId == shipper.Id && r.Status == CodRemittanceStatus.Pending,
                disableTracking: true);
            var pendingSum = pending.Sum(r => r.Amount);
            var available = Math.Max(0, shipper.CodCollectedAmount - pendingSum);
            if (available <= 0)
                return ApiResponse.Failure(400, "Không còn COD cần nộp (hoặc đã có yêu cầu đang chờ duyệt).");

            var amount = Math.Min(request.Amount, available);
            var entity = new CodRemittanceRequest
            {
                Id = Guid.NewGuid(),
                ShipperProfileId = shipper.Id,
                Amount = amount,
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
                ProofImageUrl = string.IsNullOrWhiteSpace(request.ProofImageUrl) ? null : request.ProofImageUrl.Trim(),
                Status = CodRemittanceStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _remittanceRepository.Add(entity);

            var reviewers = await _userRepository.GetAsync(
                predicate: u => u.Profile != null && (u.Profile.Role == UserRole.Admin || u.Profile.Role == UserRole.Coordinator),
                include: q => q.Include(u => u.Profile),
                disableTracking: true);

            var shipperName = profile.FullName;
            var title = "Yêu cầu nộp tiền thu hộ (COD)";
            var message = $"{shipperName} gửi yêu cầu nộp {amount:N0}đ tiền thu hộ (COD) về nền tảng. Vào trang Duyệt nộp COD để xét duyệt.";
            var toPush = new List<Notification>();

            foreach (var reviewer in reviewers)
            {
                var n = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = reviewer.Id,
                    Title = title,
                    Message = message,
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                    TargetId = entity.Id
                };
                _notificationRepository.Add(n);
                toPush.Add(n);
            }

            await _unitOfWork.SaveChangesAsync();

            foreach (var n in toPush)
            {
                var link = reviewers.First(u => u.Id == n.UserId).Profile!.Role == UserRole.Coordinator
                    ? "/coordinator/cod-remittances"
                    : "/admin/cod-remittances";
                await _notificationPushService.PushToUserAsync(n.UserId, new
                {
                    title = n.Title,
                    message = n.Message,
                    type = "System",
                    link
                });
            }

            return ApiResponse.Success(new
            {
                remittanceId = entity.Id,
                amount,
                status = entity.Status.ToString(),
                availableAfterRequest = available - amount,
                pendingTotal = pendingSum + amount
            }, "Đã gửi yêu cầu nộp COD. Chờ Admin/Điều phối duyệt.");
        }
    }

    public class ReviewCodRemittanceCommand : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public Guid RemittanceId { get; set; }
        public bool Approve { get; set; }
        public string? RejectReason { get; set; }
    }

    public class ReviewCodRemittanceHandler : IRequestHandler<ReviewCodRemittanceCommand, ApiResponse>
    {
        private readonly ICodRemittanceRequestRepository _remittanceRepository;
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPaymentSettlementService _paymentService;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationPushService _notificationPushService;
        private readonly IUnitOfWork _unitOfWork;

        public ReviewCodRemittanceHandler(
            ICodRemittanceRequestRepository remittanceRepository,
            IShipperProfileRepository shipperRepository,
            IUserRepository userRepository,
            IPaymentSettlementService paymentService,
            INotificationRepository notificationRepository,
            INotificationPushService notificationPushService,
            IUnitOfWork unitOfWork)
        {
            _remittanceRepository = remittanceRepository;
            _shipperRepository = shipperRepository;
            _userRepository = userRepository;
            _paymentService = paymentService;
            _notificationRepository = notificationRepository;
            _notificationPushService = notificationPushService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ReviewCodRemittanceCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var reviewers = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            var reviewer = reviewers.FirstOrDefault();
            var role = reviewer?.Profile?.Role;
            if (role != UserRole.Admin && role != UserRole.Coordinator)
                return ApiResponse.Failure(403, "Chỉ Admin hoặc Điều phối được duyệt nộp COD.");

            var items = await _remittanceRepository.GetAsync(
                predicate: r => r.Id == request.RemittanceId,
                include: q => q.Include(r => r.ShipperProfile).ThenInclude(s => s.UserProfile).ThenInclude(p => p.UserAccount),
                disableTracking: false);
            var remittance = items.FirstOrDefault();
            if (remittance == null)
                return ApiResponse.Failure(404, "Không tìm thấy yêu cầu nộp COD.");
            if (remittance.Status != CodRemittanceStatus.Pending)
                return ApiResponse.Failure(400, $"Yêu cầu đã được xử lý. Trạng thái: {remittance.Status}");

            var shipper = remittance.ShipperProfile;
            if (shipper == null)
                return ApiResponse.Failure(404, "Không tìm thấy hồ sơ tài xế.");

            string notifTitle;
            string notifMessage;

            if (request.Approve)
            {
                if (shipper.CodCollectedAmount < remittance.Amount)
                    return ApiResponse.Failure(400, "Số dư COD của tài xế không đủ để duyệt (đã thay đổi sau khi gửi yêu cầu).");

                shipper.CodCollectedAmount -= remittance.Amount;
                shipper.UpdatedAt = DateTime.UtcNow;
                _shipperRepository.Update(shipper);

                var shipperWallet = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Shipper, shipper.Id);
                await _paymentService.RecordTransactionAsync(shipperWallet, FinancialTransactionType.CodRemittance, -remittance.Amount,
                    $"Nộp COD thu hộ về sàn (đã duyệt): {remittance.Amount:N0}đ", remittance.Id, "CodRemittance");

                var platformWallet = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Platform, Guid.Empty);
                await _paymentService.RecordTransactionAsync(platformWallet, FinancialTransactionType.CodRemittance, remittance.Amount,
                    $"Shipper {shipper.Id.ToString()[..8]} nộp COD thu hộ (đã duyệt): {remittance.Amount:N0}đ", remittance.Id, "CodRemittance");

                remittance.Status = CodRemittanceStatus.Approved;
                remittance.RejectReason = null;
                notifTitle = "Yêu cầu nộp tiền thu hộ đã được duyệt";
                notifMessage = $"Yêu cầu nộp {remittance.Amount:N0}đ tiền thu hộ (COD) đã được xác nhận. Số tiền COD còn phải nộp: {shipper.CodCollectedAmount:N0}đ.";
            }
            else
            {
                if (string.IsNullOrWhiteSpace(request.RejectReason))
                    return ApiResponse.Failure(400, "Vui lòng nhập lý do từ chối.");

                remittance.Status = CodRemittanceStatus.Rejected;
                remittance.RejectReason = request.RejectReason.Trim();
                notifTitle = "Yêu cầu nộp tiền thu hộ bị từ chối";
                notifMessage = $"Yêu cầu nộp {remittance.Amount:N0}đ tiền thu hộ (COD) bị từ chối. Lý do: {remittance.RejectReason}. Bạn có thể gửi lại yêu cầu sau khi chỉnh sửa.";
            }

            remittance.ReviewedByUserId = request.CurrentUserId;
            remittance.ReviewedAt = DateTime.UtcNow;
            remittance.UpdatedAt = DateTime.UtcNow;
            _remittanceRepository.Update(remittance);

            var shipperAccountId = shipper.UserProfile?.UserAccountId;
            Notification? shipperNotif = null;
            if (shipperAccountId.HasValue)
            {
                shipperNotif = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = shipperAccountId.Value,
                    Title = notifTitle,
                    Message = notifMessage,
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow,
                    TargetId = remittance.Id
                };
                _notificationRepository.Add(shipperNotif);
            }

            await _unitOfWork.SaveChangesAsync();

            if (shipperNotif != null)
            {
                await _notificationPushService.PushToUserAsync(shipperNotif.UserId, new
                {
                    title = shipperNotif.Title,
                    message = shipperNotif.Message,
                    type = "System",
                    link = "/shipper/wallet"
                });
            }

            return ApiResponse.Success(new
            {
                remittanceId = remittance.Id,
                status = remittance.Status.ToString(),
                remainingDebt = shipper.CodCollectedAmount
            }, request.Approve ? "Đã duyệt nộp COD." : "Đã từ chối yêu cầu nộp COD.");
        }
    }
}
