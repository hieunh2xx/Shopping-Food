using MediatR;
using Microsoft.EntityFrameworkCore;
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

namespace ShoppingFood.Application.Features.Notifications.Commands
{
    public class BroadcastNotificationHandler : IRequestHandler<BroadcastNotificationCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ILoyaltyPointRepository _loyaltyPointRepository;
        private readonly IFlashSaleRepository _flaseSaleRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;

        public BroadcastNotificationHandler(
            IUserRepository userRepository,
            ILoyaltyPointRepository loyaltyPointRepository,
            IFlashSaleRepository flashSaleRepository,
            INotificationRepository notificationRepository,
            IEmailService emailService,
            IUnitOfWork unitOfWork
            )
        {
            _userRepository = userRepository;
            _loyaltyPointRepository = loyaltyPointRepository;
            _flaseSaleRepository = flashSaleRepository;
            _notificationRepository = notificationRepository;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(BroadcastNotificationCommand request, CancellationToken cancellationToken)
        {
            if(!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var flashSales = await _flaseSaleRepository.GetAsync(
                predicate: fs => fs.Id == request.FlashSaleId && !fs.IsDeleted,
                disableTracking: true
                );
            var flashSale = flashSales.FirstOrDefault();
            if(flashSale == null)
                return ApiResponse.Failure(404, "Flash sale not found.");

            var targetUsers = await ResolveTargetUsersAsync(request);
            if(!targetUsers.Any())
                return ApiResponse.Failure(404, "No target users found for the selected audience.");

            var title = $"Flash Sale: {flashSale.Title}";
            var message = BuildNotificationMessage(flashSale, request.CustomMessage);

            foreach (var user in targetUsers)
            {
                _notificationRepository.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Title = title,
                    Message = message,
                    NotificationType = NotificationType.System,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                });
            }

            await _unitOfWork.SaveChangesAsync();

            _ = SendEmailsAsync(targetUsers, flashSale, title, message);
            return ApiResponse.Success(new { SentCount = targetUsers.Count }, $"Flash sale notification broadcast to {targetUsers.Count} user(s) successfully.");
        }

        private async Task SendEmailsAsync(List<User> users, FlashSale flashSale, string title, string message)
        {
            var emailTasks = users
                .Where(u => !string.IsNullOrEmpty(u.Email))
                .Select(u => _emailService.SendEmailAsync(
                    u.Email!,
                    $"[ShoppingFood] {title}",
                    BuidEmailBody(u, flashSale, message)
                    ));
            await Task.WhenAll(emailTasks);
        }

        private string BuidEmailBody(User user, FlashSale flashSale, string message)
        {
            return $@"
                <h3>Xin chào {user.Profile?.FullName ?? "bạn"},</h3>
                <p>{message}</p>
                <div style='background:#fff3e0;padding:16px;border-radius:8px;border-left:4px solid #ff6d00;margin:16px 0'>
                    <h2 style='color:#ff6d00;margin:0'>🔥 {flashSale.Title}</h2>
                    <p style='margin:8px 0'>
                        🕐 Bắt đầu: <strong>{flashSale.StartDate:dd/MM/yyyy HH:mm}</strong><br/>
                        🕐 Kết thúc: <strong>{flashSale.EndDate:dd/MM/yyyy HH:mm}</strong>
                    </p>
                </div>
                <p>Truy cập ShoppingFood ngay để không bỏ lỡ ưu đãi!</p>
                <br/>
                <p>Trân trọng,<br/>Đội ngũ ShoppingFood</p>
            ";
        }

        private string BuildNotificationMessage(FlashSale flaseSale, string customMessage)
        {
            var timeInfo = $"Từ {flaseSale.StartDate:dd/MM/yyyy HH:mm} đến {flaseSale.EndDate:dd/MM/yyyy HH:mm}";
            return string.IsNullOrEmpty(customMessage)
                ? $"Chương trình Flash Sale \"{flaseSale.Title}\" sắp diễn ra! {timeInfo}."
                : $"{customMessage} {timeInfo}.";
        }

        private async Task<List<User>> ResolveTargetUsersAsync(BroadcastNotificationCommand request)
        {
            switch (request.TargetAudience)
            {
                case TargetAudience.AllCustomers:
                    {
                        var users = await _userRepository.GetAsync(
                            predicate: u => u.Status == UserStatus.Active &&
                                            u.Profile != null &&
                                            u.Profile.Role == UserRole.Customer,
                            include: q => q.Include(u => u.Profile),
                            disableTracking: true
                            );
                        return users.ToList();
                    }

                case TargetAudience.ByTier:
                    {
                        var loyaltyPoints = await _loyaltyPointRepository.GetAsync(
                            predicate: lp => lp.Tier == request.TargetTier!.Value,
                            include: q => q.Include(lp => lp.UserAccount).ThenInclude(u => u.Profile),
                            disableTracking: true
                            );
                        return loyaltyPoints
                            .Where(lp => lp.UserAccount.Status == UserStatus.Active &&
                                        lp.UserAccount.Profile?.Role == UserRole.Customer)
                            .Select(lp => lp.UserAccount).ToList();
                    }

                case TargetAudience.SpecificCustomers:
                    {
                        var users = await _userRepository.GetAsync(
                            predicate: u => request.TargetUserIds!.Contains(u.Id) &&
                                            u.Status == UserStatus.Active &&
                                            u.Profile != null &&
                                            u.Profile.Role == UserRole.Customer,
                            include: q => q.Include(u => u.Profile),
                            disableTracking: true
                            );
                        return users.ToList();
                    }

                default: return new List<User>();
            }
        }
    }
}
