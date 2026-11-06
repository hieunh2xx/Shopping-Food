using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.GroupOrders;

namespace ShoppingFood.Application.Features.GroupOrders
{
    /// <summary>Gom đơn gắn với các Order — cho nhà hàng (đóng gói từng phần) và shipper (giao từng phòng).</summary>
    public class GetGroupOrdersForOrdersQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public List<Guid> OrderIds { get; set; } = new();
    }

    public class MarkGroupPortionDeliveredCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        public Guid MemberId { get; set; }
        public bool Delivered { get; set; } = true;
    }

    internal sealed class FulfillmentViewer
    {
        public Guid UserId { get; init; }
        public bool IsStaff { get; init; }
        public HashSet<Guid> OwnedRestaurantIds { get; init; } = new();
        public Guid? ShipperId { get; init; }
        public HashSet<Guid> ProposedOrderIds { get; init; } = new();

        public static async Task<FulfillmentViewer?> LoadAsync(ShoppingFoodContext db, Guid userId, IReadOnlyCollection<Guid> orderIds, CancellationToken ct)
        {
            var user = await db.Users.Include(u => u.Profile).AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) return null;

            var role = user.Profile?.Role;
            var owned = await db.RestaurantProfiles.Where(r => r.Owner.UserAccountId == userId).Select(r => r.Id).ToListAsync(ct);
            var shipperId = await db.ShipperProfiles.Where(s => s.UserProfile.UserAccountId == userId).Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
            var proposed = shipperId.HasValue
                ? await db.OrderDeliveryProposals.Where(p => p.ShipperId == shipperId.Value && orderIds.Contains(p.OrderId)).Select(p => p.OrderId).ToListAsync(ct)
                : new List<Guid>();

            return new FulfillmentViewer
            {
                UserId = userId,
                IsStaff = role is UserRole.Admin or UserRole.Coordinator,
                OwnedRestaurantIds = owned.ToHashSet(),
                ShipperId = shipperId,
                ProposedOrderIds = proposed.ToHashSet()
            };
        }

        public bool IsAssignedShipper(Order order) => ShipperId.HasValue && order.ShipperId == ShipperId;

        public bool CanView(GroupOrder group, Order order)
            => IsStaff
               || OwnedRestaurantIds.Contains(group.RestaurantId)
               || group.Members.Any(m => m.UserAccountId == UserId)
               || IsAssignedShipper(order)
               || (ShipperId.HasValue && (order.Status == OrderStatus.WaitingForShipper || ProposedOrderIds.Contains(order.Id)));

        /// <summary>SĐT chỉ hiện cho shipper đã nhận đơn, thành viên và điều phối.</summary>
        public bool CanSeePhones(GroupOrder group, Order order)
            => IsStaff || IsAssignedShipper(order) || group.Members.Any(m => m.UserAccountId == UserId);
    }

    internal static class GroupOrderFulfillmentMapper
    {
        public static IQueryable<GroupOrder> WithFulfillmentIncludes(this IQueryable<GroupOrder> query) => query
            .Include(g => g.Campus)
            .Include(g => g.Building)
            .Include(g => g.Order)
            .Include(g => g.Members).ThenInclude(m => m.Items)
            .AsSplitQuery();

        public static GroupOrderForOrderDto ToDto(GroupOrder group, FulfillmentViewer viewer)
        {
            var order = group.Order!;
            var showPhones = viewer.CanSeePhones(group, order);
            var delivered = order.Status == OrderStatus.Delivered;
            var portions = group.Members
                .Where(m => m.Items.Any())
                .OrderBy(m => m.RoomNumber ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ThenBy(m => m.DisplayName)
                .Select((m, i) => new GroupOrderPortionDto
                {
                    MemberId = m.Id,
                    Index = i + 1,
                    DisplayName = m.DisplayName,
                    Phone = showPhones ? m.Phone : null,
                    RoomNumber = m.RoomNumber,
                    Note = m.Note,
                    IsHost = m.IsHost,
                    ItemsSubtotal = m.ItemsSubtotal,
                    DeliveredAt = m.DeliveredAt ?? (delivered ? order.UpdatedAt : null),
                    Items = m.Items.OrderBy(it => it.CreatedAt).Select(it => new GroupOrderItemDto
                    {
                        Id = it.Id,
                        ProductId = it.ProductId,
                        ItemName = it.ItemName,
                        ImageUrl = it.ImageUrl,
                        Quantity = it.Quantity,
                        UnitPrice = it.UnitPrice,
                        TotalPrice = it.UnitPrice * it.Quantity,
                        SelectedSize = it.SelectedSize,
                        SelectedToppings = it.SelectedToppings,
                        Note = it.Note
                    }).ToList()
                })
                .ToList();

            return new GroupOrderForOrderDto
            {
                OrderId = order.Id,
                GroupOrderId = group.Id,
                Code = group.Code,
                Title = group.Title,
                DeliveryMode = group.DeliveryMode.ToString(),
                CampusName = group.Campus?.Name ?? string.Empty,
                BuildingName = group.Building?.Name ?? string.Empty,
                BuildingDropPoint = group.Building?.DropPoint,
                Floors = group.Building?.Floors ?? 1,
                Note = group.Note,
                PortionCount = portions.Count,
                DeliveredCount = portions.Count(p => p.DeliveredAt.HasValue),
                ShippingFeeTotal = order.ShippingFee,
                ShipperIncome = order.ShipperIncome,
                ItemsSubtotal = order.ItemsSubtotal,
                IsPrepaid = order.PaymentMethod != PaymentMethod.COD,
                OrderStatus = order.Status.ToString(),
                CanMarkDelivered = viewer.IsAssignedShipper(order) && order.Status == OrderStatus.Shipping,
                Portions = portions
            };
        }
    }

    public class GetGroupOrdersForOrdersHandler : IRequestHandler<GetGroupOrdersForOrdersQuery, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        public GetGroupOrdersForOrdersHandler(ShoppingFoodContext db) => _db = db;

        public async Task<ApiResponse> Handle(GetGroupOrdersForOrdersQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Vui lòng đăng nhập.");

            var orderIds = request.OrderIds.Distinct().Take(100).ToList();
            if (orderIds.Count == 0)
                return ApiResponse.Success(new List<GroupOrderForOrderDto>());

            var viewer = await FulfillmentViewer.LoadAsync(_db, request.CurrentUserId.Value, orderIds, cancellationToken);
            if (viewer == null) return ApiResponse.Failure(401, "Không tìm thấy tài khoản.");

            var groups = await _db.GroupOrders
                .Where(g => g.OrderId.HasValue && orderIds.Contains(g.OrderId.Value))
                .WithFulfillmentIncludes()
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var data = groups
                .Where(g => g.Order != null && viewer.CanView(g, g.Order))
                .Select(g => GroupOrderFulfillmentMapper.ToDto(g, viewer))
                .ToList();

            return ApiResponse.Success(data);
        }
    }

    public class MarkGroupPortionDeliveredHandler : IRequestHandler<MarkGroupPortionDeliveredCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        private readonly IGroupOrderManager _manager;

        public MarkGroupPortionDeliveredHandler(ShoppingFoodContext db, IGroupOrderManager manager)
        {
            _db = db;
            _manager = manager;
        }

        public async Task<ApiResponse> Handle(MarkGroupPortionDeliveredCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Vui lòng đăng nhập.");

            var group = await _db.GroupOrders
                .Where(g => g.Id == request.GroupOrderId)
                .WithFulfillmentIncludes()
                .FirstOrDefaultAsync(cancellationToken);
            if (group?.Order == null)
                return ApiResponse.Failure(404, "Không tìm thấy đơn gom.");

            var viewer = await FulfillmentViewer.LoadAsync(_db, request.CurrentUserId.Value, new[] { group.Order.Id }, cancellationToken);
            if (viewer == null || !viewer.IsAssignedShipper(group.Order))
                return ApiResponse.Failure(403, "Chỉ shipper đang giao đơn này mới được xác nhận giao từng phần.");
            if (group.Order.Status != OrderStatus.Shipping)
                return ApiResponse.Failure(400, "Đơn chưa ở trạng thái đang giao.");

            var member = group.Members.FirstOrDefault(m => m.Id == request.MemberId && m.Items.Any());
            if (member == null)
                return ApiResponse.Failure(404, "Không tìm thấy phần ăn này trong đơn gom.");

            member.DeliveredAt = request.Delivered ? DateTime.UtcNow : null;
            if (request.Delivered)
            {
                var where = string.IsNullOrWhiteSpace(member.RoomNumber) ? group.Building.Name : $"phòng {member.RoomNumber} - {group.Building.ShortName}";
                _manager.Notify(member.UserAccountId, "Đồ ăn đã tới nơi!",
                    $"Shipper đã giao phần của bạn trong đơn gom #{group.Code} tới {where}. Chúc bạn ngon miệng!");
            }

            await _db.SaveChangesAsync(cancellationToken);

            var dto = GroupOrderFulfillmentMapper.ToDto(group, viewer);
            var message = request.Delivered
                ? $"Đã giao phần {member.DisplayName}{(string.IsNullOrWhiteSpace(member.RoomNumber) ? "" : $" (P.{member.RoomNumber})")} · {dto.DeliveredCount}/{dto.PortionCount}"
                : "Đã bỏ đánh dấu giao phần này.";
            return ApiResponse.Success(dto, message);
        }
    }
}
