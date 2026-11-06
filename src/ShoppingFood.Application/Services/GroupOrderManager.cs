using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Common;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.GroupOrders;

namespace ShoppingFood.Application.Services
{
    public class GroupOrderManager : IGroupOrderManager
    {
        private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        private readonly ShoppingFoodContext _db;
        private readonly IPaymentSettlementService _settlement;

        public GroupOrderManager(ShoppingFoodContext db, IPaymentSettlementService settlement)
        {
            _db = db;
            _settlement = settlement;
        }

        private IQueryable<GroupOrder> Query(bool tracking)
        {
            var query = _db.GroupOrders
                .Include(g => g.Campus)
                .Include(g => g.Building)
                .Include(g => g.Restaurant)
                .Include(g => g.HostUser).ThenInclude(u => u.Profile)
                .Include(g => g.Order)
                .Include(g => g.Members).ThenInclude(m => m.Items)
                .Include(g => g.Members).ThenInclude(m => m.UserAccount).ThenInclude(u => u.Profile)
                .AsSplitQuery();
            return tracking ? query : query.AsNoTracking();
        }

        public Task<GroupOrder?> LoadAsync(Guid groupOrderId, bool tracking = true)
            => Query(tracking).FirstOrDefaultAsync(g => g.Id == groupOrderId);

        public Task<GroupOrder?> LoadByCodeAsync(string code)
        {
            var normalized = code.Trim().TrimStart('#').ToUpperInvariant();
            return Query(false).FirstOrDefaultAsync(g => g.Code == normalized);
        }

        public async Task<string> GenerateCodeAsync()
        {
            for (var attempt = 0; attempt < 20; attempt++)
            {
                var chars = new char[6];
                chars[0] = 'F';
                for (var i = 1; i < chars.Length; i++)
                    chars[i] = CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)];
                var code = new string(chars);
                if (!await _db.GroupOrders.AnyAsync(g => g.Code == code))
                    return code;
            }
            return Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        }

        public async Task RefundMemberAsync(GroupOrder group, GroupOrderMember member, string reason, bool resetToUnpaid, Guid? referenceId = null, string referenceType = "GroupOrder")
        {
            if (member.PaymentStatus != GroupMemberPaymentStatus.Paid || member.PaidAmount <= 0)
            {
                if (resetToUnpaid) member.PaymentStatus = GroupMemberPaymentStatus.Unpaid;
                return;
            }

            var payerId = member.PaidByUserId ?? member.UserAccountId;
            var amount = member.PaidAmount;
            var wallet = await _settlement.GetOrCreateWalletAsync(WalletOwnerType.Customer, payerId);
            await _settlement.RecordTransactionAsync(wallet, FinancialTransactionType.Refund, amount,
                $"Hoàn tiền gom đơn #{group.Code} ({member.DisplayName}) — {reason}", referenceId ?? group.Id, referenceType);

            Notify(payerId, "Hoàn tiền gom đơn",
                $"{amount:N0}đ của phần {member.DisplayName} trong gom đơn #{group.Code} đã được hoàn về ví. Lý do: {reason}.");

            member.PaidAmount = 0;
            member.PaidAt = null;
            member.PaidByUserId = null;
            member.PaymentStatus = resetToUnpaid ? GroupMemberPaymentStatus.Unpaid : GroupMemberPaymentStatus.Refunded;
        }

        public async Task CancelAsync(GroupOrder group, string reason)
        {
            foreach (var member in group.Members)
                await RefundMemberAsync(group, member, reason, resetToUnpaid: false);

            group.Status = GroupOrderStatus.Cancelled;
            group.CancelReason = reason;
            group.UpdatedAt = DateTime.UtcNow;

            foreach (var member in group.Members)
                Notify(member.UserAccountId, "Gom đơn đã hủy", $"Phòng gom đơn #{group.Code} ({group.Title}) đã bị hủy: {reason}.");
        }

        public async Task<int> ExpireStaleAsync()
        {
            var now = DateTime.UtcNow;
            var staleIds = await _db.GroupOrders
                .Where(g => g.Status == GroupOrderStatus.Open && g.ExpiresAt < now)
                .Select(g => g.Id)
                .Take(50)
                .ToListAsync();

            foreach (var id in staleIds)
            {
                await using var tx = await _db.Database.BeginTransactionAsync();
                var group = await LoadAsync(id);
                if (group == null || group.Status != GroupOrderStatus.Open) continue;
                await CancelAsync(group, "Hết thời gian gom đơn");
                await _db.SaveChangesAsync();
                await tx.CommitAsync();
            }

            return staleIds.Count;
        }

        public void Notify(Guid userId, string title, string message, Guid? targetId = null)
        {
            _db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                NotificationType = NotificationType.Order,
                TargetId = targetId,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            });
        }

        public GroupOrderSummaryDto ToSummary(GroupOrder group, Guid? currentUserId)
        {
            var dto = new GroupOrderSummaryDto();
            FillSummary(dto, group, currentUserId);
            return dto;
        }

        public GroupOrderDetailDto ToDetail(GroupOrder group, Guid? currentUserId)
        {
            var dto = new GroupOrderDetailDto();
            FillSummary(dto, group, currentUserId);

            var me = currentUserId.HasValue ? group.Members.FirstOrDefault(m => m.UserAccountId == currentUserId.Value) : null;
            var isHost = currentUserId.HasValue && group.HostUserId == currentUserId.Value;
            var active = group.Members.Where(m => m.Items.Any()).ToList();
            var paidNames = group.Members.ToDictionary(m => m.UserAccountId, m => m.DisplayName);

            dto.CampusName = group.Campus?.Name ?? string.Empty;
            dto.BuildingDropPoint = group.Building?.DropPoint;
            dto.BuildingAllowRoomDelivery = group.Building?.AllowRoomDelivery ?? false;
            dto.HostUserId = group.HostUserId;
            dto.Note = group.Note;
            dto.CancelReason = group.CancelReason;
            dto.BaseShippingFee = group.BaseShippingFee;
            dto.SingleRoomDeliveryFee = group.Campus?.SingleRoomDeliveryFee ?? 0;
            dto.ItemsSubtotal = group.ItemsSubtotal;
            dto.ShippingFeeTotal = group.ShippingFeeTotal;
            dto.ShipperIncome = group.ShipperIncome;
            dto.TotalAmount = group.TotalAmount;
            dto.PrepayShippingShare = GroupOrderPricing.PrepayShare(group);
            dto.ActiveMemberCount = active.Count;
            dto.PaidMemberCount = active.Count(m => m.PaymentStatus == GroupMemberPaymentStatus.Paid);
            dto.IsHost = isHost;
            dto.RestaurantIsOpen = group.Restaurant?.IsCurrentlyOpen(DateTime.UtcNow) ?? false;
            dto.SubmittedAt = group.SubmittedAt;
            dto.MyMemberId = me?.Id;
            dto.SubmitBlockReason = GetSubmitBlockReason(group, dto.RestaurantIsOpen);
            dto.CanSubmit = isHost && dto.SubmitBlockReason == null;

            var canSeeContacts = me != null || isHost;
            dto.Members = group.Members
                .OrderByDescending(m => m.IsHost)
                .ThenBy(m => m.JoinedAt)
                .Select(m => new GroupOrderMemberDto
                {
                    Id = m.Id,
                    UserAccountId = m.UserAccountId,
                    DisplayName = m.DisplayName,
                    AvatarUrl = m.UserAccount?.Profile?.AvatarUrl,
                    Phone = canSeeContacts ? m.Phone : null,
                    RoomNumber = canSeeContacts ? m.RoomNumber : null,
                    Note = canSeeContacts ? m.Note : null,
                    IsHost = m.IsHost,
                    IsMe = currentUserId.HasValue && m.UserAccountId == currentUserId.Value,
                    ItemsSubtotal = m.ItemsSubtotal,
                    ShippingShare = m.ShippingShare,
                    AmountDue = GroupOrderPricing.AmountDue(m),
                    PrepayAmount = GroupOrderPricing.PrepayAmount(group, m),
                    PaidAmount = m.PaidAmount,
                    PaymentStatus = m.PaymentStatus.ToString(),
                    PaidByUserId = m.PaidByUserId,
                    PaidByName = m.PaidByUserId.HasValue && paidNames.TryGetValue(m.PaidByUserId.Value, out var payer) ? payer : null,
                    PaidAt = m.PaidAt,
                    DeliveredAt = m.DeliveredAt ?? (group.Order?.Status == OrderStatus.Delivered ? group.Order.UpdatedAt : null),
                    JoinedAt = m.JoinedAt,
                    Items = m.Items.OrderBy(i => i.CreatedAt).Select(i => new GroupOrderItemDto
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ItemName = i.ItemName,
                        ImageUrl = i.ImageUrl,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        TotalPrice = i.UnitPrice * i.Quantity,
                        SelectedSize = i.SelectedSize,
                        SelectedToppings = i.SelectedToppings,
                        Note = i.Note
                    }).ToList()
                }).ToList();

            return dto;
        }

        public static string? GetSubmitBlockReason(GroupOrder group, bool restaurantIsOpen)
        {
            if (group.Status != GroupOrderStatus.Open)
                return "Phòng gom đơn đã đóng.";
            if (group.ExpiresAt < DateTime.UtcNow)
                return "Phòng gom đơn đã hết thời gian.";
            if (!restaurantIsOpen)
                return "Quán hiện đang đóng cửa.";

            var active = group.Members.Where(m => m.Items.Any()).ToList();
            if (active.Count < group.MinMembers)
                return $"Cần ít nhất {group.MinMembers} người đặt món ({active.Count}/{group.MinMembers}).";
            if (group.DeliveryMode == GroupDeliveryMode.Room && active.Any(m => string.IsNullOrWhiteSpace(m.RoomNumber)))
                return "Có thành viên chưa nhập số phòng để giao tận phòng.";
            var unpaid = active.Count(m => m.PaymentStatus != GroupMemberPaymentStatus.Paid);
            if (unpaid > 0)
                return $"Còn {unpaid} người chưa thanh toán trước.";
            return null;
        }

        private static void FillSummary(GroupOrderSummaryDto dto, GroupOrder group, Guid? currentUserId)
        {
            dto.Id = group.Id;
            dto.Code = group.Code;
            dto.Title = group.Title;
            dto.Status = group.Status.ToString();
            dto.DeliveryMode = group.DeliveryMode.ToString();
            dto.PaymentMode = group.PaymentMode.ToString();
            dto.CampusId = group.CampusId;
            dto.CampusShortName = group.Campus?.ShortName ?? string.Empty;
            dto.BuildingId = group.BuildingId;
            dto.BuildingName = group.Building?.Name ?? string.Empty;
            dto.BuildingShortName = group.Building?.ShortName ?? string.Empty;
            dto.RestaurantId = group.RestaurantId;
            dto.RestaurantName = group.Restaurant?.RestaurantName ?? string.Empty;
            dto.RestaurantLogoUrl = group.Restaurant?.LogoUrl;
            dto.HostName = group.Members.FirstOrDefault(m => m.IsHost)?.DisplayName
                ?? group.HostUser?.Profile?.FullName ?? group.HostUser?.UserName ?? string.Empty;
            dto.MemberCount = group.Members.Count;
            dto.MinMembers = group.MinMembers;
            dto.MaxMembers = group.MaxMembers;
            dto.ShippingSharePerMember = GroupOrderPricing.CurrentShare(group);
            dto.SurchargePerMember = group.SurchargePerMember;
            dto.ExpiresAt = group.ExpiresAt;
            dto.CreatedAt = group.CreatedAt;
            dto.OrderId = group.OrderId;
            dto.OrderStatus = group.Order?.Status.ToString();
            dto.IsMember = currentUserId.HasValue && group.Members.Any(m => m.UserAccountId == currentUserId.Value);
        }
    }
}
