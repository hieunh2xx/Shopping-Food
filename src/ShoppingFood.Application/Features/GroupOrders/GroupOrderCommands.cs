using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Common;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Application.Features.GroupOrders
{
    public class CreateGroupOrderCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid CampusId { get; set; }
        public Guid BuildingId { get; set; }
        public Guid RestaurantId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string DeliveryMode { get; set; } = nameof(GroupDeliveryMode.Room);
        public string PaymentMode { get; set; } = nameof(GroupPaymentMode.Individual);
        public string? RoomNumber { get; set; }
        public string? Phone { get; set; }
        public string? Note { get; set; }
        public int DurationMinutes { get; set; } = 45;
        /// <summary>Món của trưởng nhóm chọn ngay khi tạo phòng.</summary>
        public List<GroupOrderItemInput>? Items { get; set; }
        /// <summary>Chuyển các món của quán này trong giỏ hàng sang phần của trưởng nhóm (và xóa khỏi giỏ).</summary>
        public bool FromCart { get; set; }
    }

    public class GroupOrderItemInput
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? SelectedSize { get; set; }
        public List<string>? SelectedToppings { get; set; }
        public string? Note { get; set; }
    }

    public class JoinGroupOrderCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        public string? RoomNumber { get; set; }
        public string? Phone { get; set; }
        public string? Note { get; set; }
        public List<GroupOrderItemInput>? Items { get; set; }
        public bool FromCart { get; set; }
    }

    public class UpdateGroupOrderMembershipCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        public string? RoomNumber { get; set; }
        public string? Phone { get; set; }
        public string? Note { get; set; }
    }

    public class AddGroupOrderItemCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        public Guid ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? SelectedSize { get; set; }
        public List<string>? SelectedToppings { get; set; }
        public string? Note { get; set; }
    }

    public class UpdateGroupOrderItemCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        public Guid ItemId { get; set; }
        public int Quantity { get; set; }
    }

    public class PayGroupOrderCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        /// <summary>Trưởng nhóm trả hộ toàn bộ phần chưa thanh toán.</summary>
        public bool ForAll { get; set; }
    }

    public class UnpayGroupOrderCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        public Guid? MemberId { get; set; }
    }

    public class LeaveGroupOrderCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
    }

    public class RemoveGroupOrderMemberCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        public Guid MemberId { get; set; }
    }

    public class CancelGroupOrderCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
        public string? Reason { get; set; }
    }

    public class SubmitGroupOrderCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid GroupOrderId { get; set; }
    }

    public class ExpireGroupOrdersCommand : IRequest<int>
    {
    }

    /// <summary>Shared load/validate/save flow for commands that mutate an open group order.</summary>
    public abstract class GroupOrderCommandHandlerBase
    {
        protected readonly ShoppingFoodContext Db;
        protected readonly IGroupOrderManager Manager;
        protected readonly IUnitOfWork UnitOfWork;

        protected GroupOrderCommandHandlerBase(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork)
        {
            Db = db;
            Manager = manager;
            UnitOfWork = unitOfWork;
        }

        protected async Task<(GroupOrder? Group, GroupOrderMember? Me, ApiResponse? Error)> LoadOpenAsync(Guid groupOrderId, Guid? userId, bool requireMember = true)
        {
            if (!userId.HasValue)
                return (null, null, ApiResponse.Failure(401, "Vui lòng đăng nhập để tham gia gom đơn."));

            var group = await Manager.LoadAsync(groupOrderId);
            if (group == null)
                return (null, null, ApiResponse.Failure(404, "Không tìm thấy phòng gom đơn."));
            if (group.Status != GroupOrderStatus.Open)
                return (group, null, ApiResponse.Failure(400, group.Status == GroupOrderStatus.Submitted
                    ? "Phòng gom đơn đã chốt, không thể thay đổi."
                    : "Phòng gom đơn đã bị hủy."));
            if (group.ExpiresAt < DateTime.UtcNow)
                return (group, null, ApiResponse.Failure(400, "Phòng gom đơn đã hết thời gian."));

            var me = group.Members.FirstOrDefault(m => m.UserAccountId == userId.Value);
            if (requireMember && me == null)
                return (group, null, ApiResponse.Failure(403, "Bạn chưa tham gia phòng gom đơn này."));

            return (group, me, null);
        }

        protected async Task<ApiResponse> SaveAndReturnAsync(GroupOrder group, Guid? userId, string message)
        {
            GroupOrderPricing.Recalculate(group);
            await Db.SaveChangesAsync();
            var fresh = await Manager.LoadAsync(group.Id, tracking: false);
            return ApiResponse.Success(Manager.ToDetail(fresh ?? group, userId), message);
        }

        protected static string? NormalizePhone(string? phone)
        {
            var value = phone?.Trim().Replace(" ", "");
            return string.IsNullOrEmpty(value) ? null : value;
        }

        protected static bool IsValidPhone(string? phone)
            => !string.IsNullOrEmpty(phone) && phone.Length is >= 9 and <= 15 && phone.All(c => char.IsDigit(c) || c == '+');
    }

    public class CreateGroupOrderHandler : GroupOrderCommandHandlerBase, IRequestHandler<CreateGroupOrderCommand, ApiResponse>
    {
        public CreateGroupOrderHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(CreateGroupOrderCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Vui lòng đăng nhập để tạo phòng gom đơn.");
            if (!Enum.TryParse<GroupDeliveryMode>(request.DeliveryMode, true, out var mode))
                return ApiResponse.Failure(400, "Hình thức giao không hợp lệ.");
            if (!Enum.TryParse<GroupPaymentMode>(request.PaymentMode, true, out var paymentMode))
                return ApiResponse.Failure(400, "Hình thức chia tiền không hợp lệ.");

            var user = await Db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == request.CurrentUserId.Value, cancellationToken);
            if (user == null) return ApiResponse.Failure(401, "Không tìm thấy tài khoản.");

            var campus = await Db.Campuses.FirstOrDefaultAsync(c => c.Id == request.CampusId && c.IsActive, cancellationToken);
            if (campus == null) return ApiResponse.Failure(404, "Không tìm thấy trường hoặc trường đang tạm ngưng gom đơn.");

            var building = await Db.CampusBuildings.FirstOrDefaultAsync(b => b.Id == request.BuildingId && b.CampusId == campus.Id && b.IsActive, cancellationToken);
            if (building == null) return ApiResponse.Failure(404, "Không tìm thấy điểm giao trong trường này.");

            var buildingError = ValidateBuildingForMode(building, mode);
            if (buildingError != null) return ApiResponse.Failure(400, buildingError);

            var restaurant = await Db.RestaurantProfiles.FirstOrDefaultAsync(r => r.Id == request.RestaurantId, cancellationToken);
            var closed = ProductAvailabilityHelper.ValidateRestaurantCanAcceptOrders(restaurant, DateTime.UtcNow);
            if (restaurant == null || restaurant.Status != RestaurantStatus.Active || closed != null)
                return ApiResponse.Failure(400, closed ?? "Quán hiện không nhận đơn.");

            var phone = NormalizePhone(request.Phone) ?? NormalizePhone(user.Phone);
            if (!IsValidPhone(phone))
                return ApiResponse.Failure(400, "Vui lòng nhập số điện thoại nhận hàng hợp lệ.");
            if (mode == GroupDeliveryMode.Room && string.IsNullOrWhiteSpace(request.RoomNumber))
                return ApiResponse.Failure(400, "Giao tận phòng cần nhập số phòng của bạn.");

            var hostingCount = await Db.GroupOrders.CountAsync(g => g.HostUserId == user.Id && g.Status == GroupOrderStatus.Open && g.ExpiresAt > DateTime.UtcNow, cancellationToken);
            if (hostingCount >= 2)
                return ApiResponse.Failure(400, "Bạn đang làm trưởng nhóm 2 phòng gom đơn. Hãy chốt hoặc hủy bớt trước khi tạo phòng mới.");

            var now = DateTime.UtcNow;
            var hostMemberId = Guid.NewGuid();
            var (hostItems, cartItemsToRemove, itemsError) = await ResolveMemberItemsAsync(
                Db, user.Id, restaurant, hostMemberId, request.Items, request.FromCart, "tạo đơn nhóm", now, cancellationToken);
            if (itemsError != null) return ApiResponse.Failure(400, itemsError);

            var title = string.IsNullOrWhiteSpace(request.Title)
                ? $"Gom đơn {restaurant.RestaurantName} - {building.ShortName}"
                : request.Title.Trim();
            if (title.Length > 150) title = title[..150];

            var group = new GroupOrder
            {
                Id = Guid.NewGuid(),
                Code = await Manager.GenerateCodeAsync(),
                Title = title,
                CampusId = campus.Id,
                BuildingId = building.Id,
                RestaurantId = restaurant.Id,
                HostUserId = user.Id,
                DeliveryMode = mode,
                PaymentMode = paymentMode,
                Status = GroupOrderStatus.Open,
                MinMembers = campus.MinGroupMembers,
                MaxMembers = campus.MaxGroupMembers,
                BaseShippingFee = campus.GroupBaseShippingFee,
                SurchargePerMember = GroupOrderPricing.SurchargeFor(campus, mode),
                Note = request.Note?.Trim(),
                ExpiresAt = now.AddMinutes(Math.Clamp(request.DurationMinutes, 15, 180)),
                CreatedAt = now,
                UpdatedAt = now
            };
            var host = new GroupOrderMember
            {
                Id = hostMemberId,
                GroupOrderId = group.Id,
                UserAccountId = user.Id,
                DisplayName = DisplayNameOf(user),
                Phone = phone!,
                RoomNumber = request.RoomNumber?.Trim(),
                IsHost = true,
                JoinedAt = now
            };
            group.Members.Add(host);
            Db.GroupOrders.Add(group);
            foreach (var item in hostItems)
                AddGroupOrderItemHandler.MergeOrAdd(Db, host, item);
            Db.CartItems.RemoveRange(cartItemsToRemove);

            return await SaveAndReturnAsync(group, user.Id,
                $"Đã tạo phòng gom đơn #{group.Code} với {host.Items.Sum(i => i.Quantity)} món của bạn. Gửi mã PIN cho bạn bè cùng tòa nhé!");
        }

        /// <summary>
        /// Món của một thành viên khi tạo / vào phòng: món chọn trực tiếp + (tùy chọn) món của đúng quán đó trong giỏ hàng.
        /// Bắt buộc có ít nhất 1 món.
        /// </summary>
        internal static async Task<(List<GroupOrderItem> Items, List<CartItem> CartItemsToRemove, string? Error)> ResolveMemberItemsAsync(
            ShoppingFoodContext db, Guid userId, RestaurantProfile restaurant, Guid memberId,
            List<GroupOrderItemInput>? items, bool fromCart, string action, DateTime now, CancellationToken cancellationToken)
        {
            var selections = (items ?? new List<GroupOrderItemInput>()).ToList();
            var cartItems = fromCart
                ? await db.CartItems
                    .Where(ci => ci.Cart.UserAccountId == userId && ci.Product.RestaurantId == restaurant.Id)
                    .ToListAsync(cancellationToken)
                : new List<CartItem>();
            var paidCartItems = cartItems.Where(ci => !ci.IsGift).ToList();

            var products = await AddGroupOrderItemHandler.LoadProductsAsync(db,
                selections.Select(s => s.ProductId).Concat(paidCartItems.Select(ci => ci.ProductId)), cancellationToken);

            var built = new List<GroupOrderItem>();
            foreach (var selection in selections)
            {
                products.TryGetValue(selection.ProductId, out var product);
                var (item, error) = AddGroupOrderItemHandler.BuildItem(product, restaurant.Id, memberId, selection.Quantity,
                    selection.SelectedSize, selection.SelectedToppings, selection.Note, now);
                if (error != null) return (new(), new(), error);
                built.Add(item!);
            }

            // Cart lines that stopped selling stay in the cart instead of blocking the whole group order.
            var movedCartItems = new List<CartItem>();
            foreach (var cartItem in paidCartItems)
            {
                products.TryGetValue(cartItem.ProductId, out var product);
                var toppings = cartItem.SelectedToppings?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var (item, error) = AddGroupOrderItemHandler.BuildItem(product, restaurant.Id, memberId, cartItem.Quantity,
                    cartItem.SelectedSize, toppings, null, now);
                if (error != null) continue;
                built.Add(item!);
                movedCartItems.Add(cartItem);
                movedCartItems.AddRange(cartItems.Where(ci => ci.IsGift && ci.ParentCartItemId == cartItem.Id));
            }

            if (built.Count == 0)
                return (new(), new(), fromCart && paidCartItems.Count > 0
                    ? $"Các món của {restaurant.RestaurantName} trong giỏ hàng hiện đã dừng bán. Hãy chọn món khác trước khi {action}."
                    : $"Hãy chọn ít nhất 1 món cho phần của bạn trước khi {action}.");

            return (built, movedCartItems, null);
        }

        internal static string? ValidateBuildingForMode(CampusBuilding building, GroupDeliveryMode mode)
        {
            if (mode == GroupDeliveryMode.Gate && building.BuildingType != CampusBuildingType.Gate)
                return "Ship cổng trường cần chọn điểm giao là một cổng trên sơ đồ.";
            if (mode != GroupDeliveryMode.Gate && building.BuildingType is not (CampusBuildingType.Dormitory or CampusBuildingType.Lecture))
                return "Giao sảnh / tận phòng cần chọn một Dom KTX hoặc tòa giảng đường.";
            if (mode == GroupDeliveryMode.Room && !building.AllowRoomDelivery)
                return $"{building.Name} chưa hỗ trợ giao tận phòng. Hãy chọn giao sảnh.";
            return null;
        }

        internal static string DisplayNameOf(User user)
        {
            var name = user.Profile?.FullName;
            if (string.IsNullOrWhiteSpace(name)) name = user.UserName ?? "Sinh viên";
            return name.Length > 100 ? name[..100] : name;
        }
    }

    public class JoinGroupOrderHandler : GroupOrderCommandHandlerBase, IRequestHandler<JoinGroupOrderCommand, ApiResponse>
    {
        public JoinGroupOrderHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(JoinGroupOrderCommand request, CancellationToken cancellationToken)
        {
            var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId, requireMember: false);
            if (error != null) return error;
            if (me != null) return ApiResponse.Success(Manager.ToDetail(group!, request.CurrentUserId), "Bạn đã ở trong phòng này.");
            if (group!.Members.Count >= group.MaxMembers)
                return ApiResponse.Failure(400, $"Phòng đã đủ {group.MaxMembers} người.");

            var user = await Db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == request.CurrentUserId!.Value, cancellationToken);
            if (user == null) return ApiResponse.Failure(401, "Không tìm thấy tài khoản.");

            var phone = NormalizePhone(request.Phone) ?? NormalizePhone(user.Phone);
            if (!IsValidPhone(phone))
                return ApiResponse.Failure(400, "Vui lòng nhập số điện thoại nhận hàng hợp lệ.");
            if (group.DeliveryMode == GroupDeliveryMode.Room && string.IsNullOrWhiteSpace(request.RoomNumber))
                return ApiResponse.Failure(400, "Phòng này giao tận phòng — vui lòng nhập số phòng của bạn.");

            var memberId = Guid.NewGuid();
            var (items, cartItemsToRemove, itemsError) = await CreateGroupOrderHandler.ResolveMemberItemsAsync(
                Db, user.Id, group.Restaurant, memberId, request.Items, request.FromCart, "vào phòng gom đơn", DateTime.UtcNow, cancellationToken);
            if (itemsError != null) return ApiResponse.Failure(400, itemsError);

            var member = new GroupOrderMember
            {
                Id = memberId,
                GroupOrderId = group.Id,
                UserAccountId = user.Id,
                DisplayName = CreateGroupOrderHandler.DisplayNameOf(user),
                Phone = phone!,
                RoomNumber = request.RoomNumber?.Trim(),
                Note = request.Note?.Trim(),
                JoinedAt = DateTime.UtcNow
            };
            group.Members.Add(member);
            Db.GroupOrderMembers.Add(member);
            foreach (var item in items)
                AddGroupOrderItemHandler.MergeOrAdd(Db, member, item);
            Db.CartItems.RemoveRange(cartItemsToRemove);

            Manager.Notify(group.HostUserId, "Có bạn mới vào phòng gom đơn",
                $"{member.DisplayName}{(string.IsNullOrWhiteSpace(member.RoomNumber) ? "" : $" (phòng {member.RoomNumber})")} vừa vào phòng #{group.Code} với {member.Items.Sum(i => i.Quantity)} món.");

            return await SaveAndReturnAsync(group, user.Id, "Đã vào phòng gom đơn với món của bạn. Thanh toán trước để trưởng nhóm chốt đơn nhé!");
        }
    }

    public class UpdateGroupOrderMembershipHandler : GroupOrderCommandHandlerBase, IRequestHandler<UpdateGroupOrderMembershipCommand, ApiResponse>
    {
        public UpdateGroupOrderMembershipHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(UpdateGroupOrderMembershipCommand request, CancellationToken cancellationToken)
        {
            var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
            if (error != null) return error;

            var phone = NormalizePhone(request.Phone);
            if (phone != null)
            {
                if (!IsValidPhone(phone)) return ApiResponse.Failure(400, "Số điện thoại không hợp lệ.");
                me!.Phone = phone;
            }
            if (group!.DeliveryMode == GroupDeliveryMode.Room && string.IsNullOrWhiteSpace(request.RoomNumber))
                return ApiResponse.Failure(400, "Giao tận phòng cần có số phòng.");

            me!.RoomNumber = request.RoomNumber?.Trim();
            me.Note = request.Note?.Trim();
            return await SaveAndReturnAsync(group, request.CurrentUserId, "Đã cập nhật thông tin nhận hàng.");
        }
    }

    public class AddGroupOrderItemHandler : GroupOrderCommandHandlerBase, IRequestHandler<AddGroupOrderItemCommand, ApiResponse>
    {
        public AddGroupOrderItemHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(AddGroupOrderItemCommand request, CancellationToken cancellationToken)
        {
            var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
            if (error != null) return error;
            if (me!.PaymentStatus == GroupMemberPaymentStatus.Paid)
                return ApiResponse.Failure(400, "Phần của bạn đã thanh toán. Hủy thanh toán để sửa món.");

            var products = await LoadProductsAsync(Db, new[] { request.ProductId }, cancellationToken);
            products.TryGetValue(request.ProductId, out var product);

            var (built, buildError) = BuildItem(product, group!.RestaurantId, me.Id, request.Quantity, request.SelectedSize, request.SelectedToppings, request.Note, DateTime.UtcNow);
            if (buildError != null) return ApiResponse.Failure(400, buildError);

            MergeOrAdd(Db, me, built!);
            return await SaveAndReturnAsync(group, request.CurrentUserId, $"Đã thêm {built!.ItemName} vào phần của bạn.");
        }

        internal static Task<Dictionary<Guid, Product>> LoadProductsAsync(ShoppingFoodContext db, IEnumerable<Guid> productIds, CancellationToken cancellationToken)
        {
            var ids = productIds.Distinct().ToList();
            return db.Products
                .Include(p => p.Restaurant)
                .Include(p => p.Images)
                .Include(p => p.ProductSizes)
                .Include(p => p.ProductToppings).ThenInclude(pt => pt.Topping)
                .AsSplitQuery()
                .Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, cancellationToken);
        }

        /// <summary>Validates a product selection and builds the group item with size/topping-inclusive unit price.</summary>
        internal static (GroupOrderItem? Item, string? Error) BuildItem(Product? product, Guid restaurantId, Guid memberId, int quantity,
            string? selectedSize, IEnumerable<string>? selectedToppings, string? note, DateTime utcNow)
        {
            if (quantity < 1 || quantity > 20)
                return (null, "Số lượng mỗi món từ 1 đến 20.");

            var productError = ValidateProduct(product, restaurantId, utcNow);
            if (productError != null) return (null, productError);

            var toppings = (selectedToppings ?? Enumerable.Empty<string>())
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var toppingError = ProductAvailabilityHelper.ValidateSelectedToppings(product!, toppings);
            if (toppingError != null) return (null, toppingError);

            decimal unitPrice = product!.Price;
            string? sizeName = null;
            if (!string.IsNullOrWhiteSpace(selectedSize))
            {
                var size = product.ProductSizes.FirstOrDefault(s => s.SizeName.Equals(selectedSize.Trim(), StringComparison.OrdinalIgnoreCase));
                if (size == null) return (null, $"Size không thuộc món {product.ItemName}.");
                unitPrice += size.ExtraPrice;
                sizeName = size.SizeName;
            }
            var canonicalToppings = new List<string>();
            foreach (var name in toppings)
            {
                var topping = product.ProductToppings.Select(pt => pt.Topping).First(t => t.ToppingName.Equals(name, StringComparison.OrdinalIgnoreCase));
                unitPrice += topping.Price;
                canonicalToppings.Add(topping.ToppingName);
            }

            return (new GroupOrderItem
            {
                Id = Guid.NewGuid(),
                GroupOrderMemberId = memberId,
                ProductId = product.Id,
                ItemName = product.ItemName,
                ImageUrl = product.Images.OrderByDescending(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault(),
                Quantity = quantity,
                UnitPrice = unitPrice,
                SelectedSize = sizeName,
                SelectedToppings = canonicalToppings.Count > 0 ? string.Join(", ", canonicalToppings) : null,
                Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
                CreatedAt = DateTime.UtcNow
            }, null);
        }

        internal static void MergeOrAdd(ShoppingFoodContext db, GroupOrderMember member, GroupOrderItem item)
        {
            var existing = member.Items.FirstOrDefault(i => i.ProductId == item.ProductId && i.SelectedSize == item.SelectedSize
                && i.SelectedToppings == item.SelectedToppings && i.Note == item.Note);
            if (existing != null)
            {
                existing.Quantity = Math.Min(20, existing.Quantity + item.Quantity);
                return;
            }
            member.Items.Add(item);
            db.GroupOrderItems.Add(item);
        }

        internal static string? ValidateProduct(Product? product, Guid restaurantId, DateTime utcNow)
        {
            if (product == null || product.IsDeleted || product.IsHidden || product.Status != ProductStatus.Approved)
                return "Món này hiện không còn bán.";
            if (product.RestaurantId != restaurantId)
                return "Gom đơn chỉ được đặt món của cùng một quán.";
            var closed = ProductAvailabilityHelper.ValidateRestaurantCanAcceptOrders(product.Restaurant, utcNow);
            if (closed != null) return closed;
            if (product.StockStatus != StockStatus.InStock)
                return $"Món {product.ItemName} đã hết hàng.";
            if (!product.IsCurrentlyAvailable(utcNow))
                return $"Món {product.ItemName} hiện chưa tới giờ mở bán.";
            return null;
        }
    }

    public class UpdateGroupOrderItemHandler : GroupOrderCommandHandlerBase, IRequestHandler<UpdateGroupOrderItemCommand, ApiResponse>
    {
        public UpdateGroupOrderItemHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(UpdateGroupOrderItemCommand request, CancellationToken cancellationToken)
        {
            var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
            if (error != null) return error;
            if (me!.PaymentStatus == GroupMemberPaymentStatus.Paid)
                return ApiResponse.Failure(400, "Phần của bạn đã thanh toán. Hủy thanh toán để sửa món.");

            var item = me.Items.FirstOrDefault(i => i.Id == request.ItemId);
            if (item == null) return ApiResponse.Failure(404, "Không tìm thấy món trong phần của bạn.");
            if (request.Quantity > 20) return ApiResponse.Failure(400, "Số lượng mỗi món tối đa 20.");

            if (request.Quantity <= 0)
            {
                me.Items.Remove(item);
                Db.GroupOrderItems.Remove(item);
                return await SaveAndReturnAsync(group!, request.CurrentUserId, "Đã xóa món.");
            }

            item.Quantity = request.Quantity;
            return await SaveAndReturnAsync(group!, request.CurrentUserId, "Đã cập nhật số lượng.");
        }
    }

    public class PayGroupOrderHandler : GroupOrderCommandHandlerBase, IRequestHandler<PayGroupOrderCommand, ApiResponse>
    {
        private readonly IPaymentSettlementService _settlement;

        public PayGroupOrderHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork, IPaymentSettlementService settlement)
            : base(db, manager, unitOfWork) => _settlement = settlement;

        public async Task<ApiResponse> Handle(PayGroupOrderCommand request, CancellationToken cancellationToken)
        {
            await using var tx = await Db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
                if (error != null) return error;
                GroupOrderPricing.Recalculate(group!);

                List<GroupOrderMember> targets;
                if (request.ForAll)
                {
                    if (!me!.IsHost) return ApiResponse.Failure(403, "Chỉ trưởng nhóm mới được trả hộ cả nhóm.");
                    targets = group!.Members.Where(m => m.Items.Any() && m.PaymentStatus != GroupMemberPaymentStatus.Paid).ToList();
                    if (targets.Count == 0) return ApiResponse.Failure(400, "Không còn phần nào cần thanh toán.");
                }
                else
                {
                    if (!me!.Items.Any()) return ApiResponse.Failure(400, "Bạn chưa chọn món nào.");
                    if (me.PaymentStatus == GroupMemberPaymentStatus.Paid) return ApiResponse.Failure(400, "Phần của bạn đã được thanh toán.");
                    targets = new List<GroupOrderMember> { me };
                }

                var amounts = targets.ToDictionary(m => m.Id, m => GroupOrderPricing.PrepayAmount(group!, m));
                var total = amounts.Values.Sum();

                var wallet = await _settlement.GetOrCreateWalletAsync(WalletOwnerType.Customer, request.CurrentUserId!.Value);
                if (wallet.Balance < total)
                    return ApiResponse.Failure(400, $"Số dư ví không đủ ({wallet.Balance:N0}đ / cần {total:N0}đ). Vui lòng nạp thêm tiền vào ví.");

                var who = request.ForAll ? $"trả hộ {targets.Count} phần" : "phần của tôi";
                await _settlement.RecordTransactionAsync(wallet, FinancialTransactionType.Payment, -total,
                    $"Thanh toán gom đơn #{group!.Code} ({who})", group.Id, "GroupOrder");

                var now = DateTime.UtcNow;
                foreach (var member in targets)
                {
                    member.PaymentStatus = GroupMemberPaymentStatus.Paid;
                    member.PaidAmount = amounts[member.Id];
                    member.PaidByUserId = request.CurrentUserId;
                    member.PaidAt = now;
                    if (member.UserAccountId != request.CurrentUserId)
                        Manager.Notify(member.UserAccountId, "Trưởng nhóm đã trả hộ",
                            $"{me.DisplayName} đã thanh toán {member.PaidAmount:N0}đ cho phần của bạn trong gom đơn #{group.Code}. Nhớ chuyển lại cho trưởng nhóm nhé!");
                }

                if (!request.ForAll && !me.IsHost)
                    Manager.Notify(group.HostUserId, "Thành viên đã thanh toán",
                        $"{me.DisplayName} đã thanh toán trước {total:N0}đ trong gom đơn #{group.Code}.");

                var response = await SaveAndReturnAsync(group, request.CurrentUserId,
                    $"Đã thanh toán {total:N0}đ từ ví. Đủ người sẽ được hoàn lại phần ship chênh lệch khi chốt đơn.");
                await tx.CommitAsync(cancellationToken);
                return response;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                await UnitOfWork.LogErrorAsync("PayGroupOrderHandler", ex);
                return ApiResponse.Failure(400, $"Thanh toán thất bại: {ex.Message}");
            }
        }
    }

    public class UnpayGroupOrderHandler : GroupOrderCommandHandlerBase, IRequestHandler<UnpayGroupOrderCommand, ApiResponse>
    {
        public UnpayGroupOrderHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(UnpayGroupOrderCommand request, CancellationToken cancellationToken)
        {
            await using var tx = await Db.Database.BeginTransactionAsync(cancellationToken);
            var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
            if (error != null) return error;

            var target = request.MemberId.HasValue ? group!.Members.FirstOrDefault(m => m.Id == request.MemberId.Value) : me;
            if (target == null) return ApiResponse.Failure(404, "Không tìm thấy thành viên.");
            if (target.PaymentStatus != GroupMemberPaymentStatus.Paid) return ApiResponse.Failure(400, "Phần này chưa thanh toán.");

            var isSelf = target.UserAccountId == request.CurrentUserId;
            var isPayer = target.PaidByUserId == request.CurrentUserId;
            if (!isSelf && !isPayer && !me!.IsHost)
                return ApiResponse.Failure(403, "Bạn không thể hủy thanh toán phần của người khác.");

            await Manager.RefundMemberAsync(group!, target, "Hủy thanh toán để sửa món", resetToUnpaid: true);
            var response = await SaveAndReturnAsync(group!, request.CurrentUserId, "Đã hủy thanh toán, tiền đã hoàn về ví người trả.");
            await tx.CommitAsync(cancellationToken);
            return response;
        }
    }

    public class LeaveGroupOrderHandler : GroupOrderCommandHandlerBase, IRequestHandler<LeaveGroupOrderCommand, ApiResponse>
    {
        public LeaveGroupOrderHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(LeaveGroupOrderCommand request, CancellationToken cancellationToken)
        {
            await using var tx = await Db.Database.BeginTransactionAsync(cancellationToken);
            var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
            if (error != null) return error;
            if (me!.IsHost) return ApiResponse.Failure(400, "Trưởng nhóm không thể rời phòng. Hãy hủy phòng gom đơn nếu không đặt nữa.");

            await Manager.RefundMemberAsync(group!, me, "Rời phòng gom đơn", resetToUnpaid: true);
            group!.Members.Remove(me);
            Db.GroupOrderMembers.Remove(me);
            Manager.Notify(group.HostUserId, "Thành viên rời phòng", $"{me.DisplayName} đã rời phòng gom đơn #{group.Code}.");

            var response = await SaveAndReturnAsync(group, request.CurrentUserId, "Bạn đã rời phòng gom đơn.");
            await tx.CommitAsync(cancellationToken);
            return response;
        }
    }

    public class RemoveGroupOrderMemberHandler : GroupOrderCommandHandlerBase, IRequestHandler<RemoveGroupOrderMemberCommand, ApiResponse>
    {
        public RemoveGroupOrderMemberHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(RemoveGroupOrderMemberCommand request, CancellationToken cancellationToken)
        {
            await using var tx = await Db.Database.BeginTransactionAsync(cancellationToken);
            var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
            if (error != null) return error;
            if (!me!.IsHost) return ApiResponse.Failure(403, "Chỉ trưởng nhóm mới được mời thành viên ra khỏi phòng.");

            var target = group!.Members.FirstOrDefault(m => m.Id == request.MemberId);
            if (target == null) return ApiResponse.Failure(404, "Không tìm thấy thành viên.");
            if (target.IsHost) return ApiResponse.Failure(400, "Không thể xóa trưởng nhóm.");

            await Manager.RefundMemberAsync(group, target, "Trưởng nhóm xóa khỏi phòng", resetToUnpaid: true);
            group.Members.Remove(target);
            Db.GroupOrderMembers.Remove(target);
            Manager.Notify(target.UserAccountId, "Bạn đã bị xóa khỏi phòng gom đơn", $"Trưởng nhóm đã xóa bạn khỏi phòng gom đơn #{group.Code}.");

            var response = await SaveAndReturnAsync(group, request.CurrentUserId, $"Đã xóa {target.DisplayName} khỏi phòng.");
            await tx.CommitAsync(cancellationToken);
            return response;
        }
    }

    public class CancelGroupOrderHandler : GroupOrderCommandHandlerBase, IRequestHandler<CancelGroupOrderCommand, ApiResponse>
    {
        public CancelGroupOrderHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork) : base(db, manager, unitOfWork) { }

        public async Task<ApiResponse> Handle(CancelGroupOrderCommand request, CancellationToken cancellationToken)
        {
            await using var tx = await Db.Database.BeginTransactionAsync(cancellationToken);
            var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
            if (error != null && group?.Status == GroupOrderStatus.Open && group.ExpiresAt < DateTime.UtcNow)
                error = null;
            if (error != null) return error;

            me ??= group!.Members.FirstOrDefault(m => m.UserAccountId == request.CurrentUserId);
            if (me == null || !me.IsHost) return ApiResponse.Failure(403, "Chỉ trưởng nhóm mới được hủy phòng gom đơn.");

            var reason = string.IsNullOrWhiteSpace(request.Reason) ? "Trưởng nhóm hủy phòng" : request.Reason.Trim();
            await Manager.CancelAsync(group!, reason.Length > 200 ? reason[..200] : reason);
            var response = await SaveAndReturnAsync(group!, request.CurrentUserId, "Đã hủy phòng gom đơn và hoàn tiền cho các thành viên đã thanh toán.");
            await tx.CommitAsync(cancellationToken);
            return response;
        }
    }

    public class SubmitGroupOrderHandler : GroupOrderCommandHandlerBase, IRequestHandler<SubmitGroupOrderCommand, ApiResponse>
    {
        private readonly IPaymentSettlementService _settlement;

        public SubmitGroupOrderHandler(ShoppingFoodContext db, IGroupOrderManager manager, IUnitOfWork unitOfWork, IPaymentSettlementService settlement)
            : base(db, manager, unitOfWork) => _settlement = settlement;

        public async Task<ApiResponse> Handle(SubmitGroupOrderCommand request, CancellationToken cancellationToken)
        {
            await using var tx = await Db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var (group, me, error) = await LoadOpenAsync(request.GroupOrderId, request.CurrentUserId);
                if (error != null) return error;
                if (!me!.IsHost) return ApiResponse.Failure(403, "Chỉ trưởng nhóm mới được chốt đơn.");

                var restaurant = await Db.RestaurantProfiles.Include(r => r.Owner)
                    .FirstOrDefaultAsync(r => r.Id == group!.RestaurantId, cancellationToken);
                var now = DateTime.UtcNow;

                foreach (var idle in group!.Members.Where(m => !m.Items.Any() && !m.IsHost).ToList())
                {
                    group.Members.Remove(idle);
                    Db.GroupOrderMembers.Remove(idle);
                }
                GroupOrderPricing.Recalculate(group);

                var block = Services.GroupOrderManager.GetSubmitBlockReason(group, restaurant?.IsCurrentlyOpen(now) ?? false);
                if (block != null) return ApiResponse.Failure(400, block);

                var active = group.Members.Where(m => m.Items.Any()).ToList();
                var productIds = active.SelectMany(m => m.Items).Select(i => i.ProductId).Distinct().ToList();
                var products = await Db.Products
                    .Include(p => p.Restaurant)
                    .Include(p => p.ProductToppings).ThenInclude(pt => pt.Topping)
                    .Where(p => productIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, cancellationToken);

                foreach (var item in active.SelectMany(m => m.Items))
                {
                    products.TryGetValue(item.ProductId, out var product);
                    var productError = AddGroupOrderItemHandler.ValidateProduct(product, group.RestaurantId, now)
                        ?? ProductAvailabilityHelper.ValidateSelectedToppingsCsv(product!, item.SelectedToppings);
                    if (productError != null)
                        return ApiResponse.Failure(400, $"{productError} Thành viên có món này cần sửa phần của mình trước khi chốt.");
                }

                // Paid amounts were collected at the MinMembers ship rate; return what more members saved.
                foreach (var member in active)
                {
                    var due = GroupOrderPricing.AmountDue(member);
                    var diff = member.PaidAmount - due;
                    if (diff < 0)
                        return ApiResponse.Failure(400, $"Phần của {member.DisplayName} đã thay đổi so với lúc thanh toán. Vui lòng thanh toán lại.");
                    if (diff > 0)
                    {
                        var payerId = member.PaidByUserId ?? member.UserAccountId;
                        var wallet = await _settlement.GetOrCreateWalletAsync(WalletOwnerType.Customer, payerId);
                        await _settlement.RecordTransactionAsync(wallet, FinancialTransactionType.Refund, diff,
                            $"Hoàn chênh lệch phí ship gom đơn #{group.Code} ({member.DisplayName}) — nhóm {active.Count} người", group.Id, "GroupOrder");
                        member.PaidAmount = due;
                    }
                }

                var order = BuildOrder(group, restaurant!, active, me, now);
                var config = await _settlement.GetConfigAsync();
                var rate = _settlement.ResolveCommissionRate(config.CommissionRate, restaurant!.CustomCommissionRate);
                var isSelfDelivery = restaurant.DeliveryType == DeliveryType.SelfDelivery;
                order.ShipperIncome = isSelfDelivery ? 0 : group.ShippingFeeTotal;
                order.ShipperBaseFeeAmount = order.ShipperIncome;
                var split = _settlement.CalculateSplit(order.TotalAmount, order.ShippingFee, order.ShipperIncome, rate, isSelfDelivery, order.ItemsSubtotal);
                order.PlatformCommission = split.PlatformCommission;
                order.SellerPayout = split.SellerPayout;
                Db.Orders.Add(order);

                group.ShipperIncome = order.ShipperIncome;
                group.Status = GroupOrderStatus.Submitted;
                group.OrderId = order.Id;
                group.SubmittedAt = now;
                group.UpdatedAt = now;

                var shortId = OrderDisplayHelper.ShortId(order.Id);
                if (restaurant.Owner?.UserAccountId is Guid ownerId)
                    Manager.Notify(ownerId, "Đơn gom mới",
                        $"Đơn gom #{shortId} ({active.Count} phần, đã thanh toán trước) giao tới {group.Building.Name}. Vào mục Đơn hàng để xác nhận — mỗi phần đã ghi phòng riêng.", order.Id);
                foreach (var member in active)
                    Manager.Notify(member.UserAccountId, "Đơn gom đã chốt",
                        $"Gom đơn #{group.Code} đã gửi tới {restaurant.RestaurantName} (đơn #{shortId}). Phí ship của bạn chỉ {member.ShippingShare:N0}đ.",
                        member.IsHost ? order.Id : null);

                await Db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                var fresh = await Manager.LoadAsync(group.Id, tracking: false);
                return ApiResponse.Success(Manager.ToDetail(fresh ?? group, request.CurrentUserId),
                    $"Đã chốt đơn gom #{group.Code} gồm {active.Count} người. Shipper nhận {order.ShipperIncome:N0}đ tiền ship cho 1 lượt giao.");
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                await UnitOfWork.LogErrorAsync("SubmitGroupOrderHandler", ex);
                return ApiResponse.Failure(400, $"Chốt đơn thất bại: {ex.Message}");
            }
        }

        private static Order BuildOrder(GroupOrder group, RestaurantProfile restaurant, List<GroupOrderMember> active, GroupOrderMember host, DateTime now)
        {
            var building = group.Building;
            var campus = group.Campus;
            var point = group.DeliveryMode switch
            {
                GroupDeliveryMode.Room => "Giao tận phòng",
                GroupDeliveryMode.Lobby => building.DropPoint ?? "Sảnh tầng 1",
                _ => building.DropPoint ?? building.Name
            };

            var order = new Order
            {
                Id = Guid.NewGuid(),
                UserAccountId = group.HostUserId,
                ContactName = Truncate($"{host.DisplayName} (gom đơn {active.Count} người)", 100),
                ContactPhone = Truncate(host.Phone, 15),
                DeliveryAddress = $"{building.Name} — {point}, {campus.Name}, {campus.Address}",
                DeliveryLatitude = building.Latitude ?? campus.Latitude,
                DeliveryLongitude = building.Longitude ?? campus.Longitude,
                PaymentMethod = PaymentMethod.SystemWallet,
                PaymentStatus = PaymentStatus.Paid,
                Status = OrderStatus.Pending,
                ItemsSubtotal = group.ItemsSubtotal,
                ShippingFee = group.ShippingFeeTotal,
                TotalAmount = group.TotalAmount,
                IpAddress = "group-order",
                CreatedAt = now,
                UpdatedAt = now
            };

            var lines = active.Select(m =>
            {
                var where = string.IsNullOrWhiteSpace(m.RoomNumber) ? "" : $"P.{m.RoomNumber} ";
                return $"{where}{m.DisplayName} {m.Phone}{(string.IsNullOrWhiteSpace(m.Note) ? "" : $" ({m.Note})")}";
            });
            var modeLabel = group.DeliveryMode switch
            {
                GroupDeliveryMode.Room => "Giao tận phòng",
                GroupDeliveryMode.Lobby => "Giao sảnh",
                _ => "Nhận tại cổng"
            };
            order.Note = Truncate($"[Gom đơn #{group.Code} · {modeLabel} · {active.Count} phần] {string.Join("; ", lines)}"
                + (string.IsNullOrWhiteSpace(group.Note) ? "" : $" | {group.Note}"), 500);

            foreach (var member in active)
            {
                var tag = string.IsNullOrWhiteSpace(member.RoomNumber) ? member.DisplayName : $"P.{member.RoomNumber}·{member.DisplayName}";
                foreach (var item in member.Items)
                {
                    order.Items.Add(new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        ProductId = item.ProductId,
                        ItemName = Truncate($"[{tag}] {item.ItemName}{(string.IsNullOrWhiteSpace(item.Note) ? "" : $" ({item.Note})")}", 100),
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TotalPrice = item.UnitPrice * item.Quantity,
                        SelectedSize = item.SelectedSize,
                        SelectedToppings = item.SelectedToppings
                    });
                }
            }

            return order;
        }

        private static string Truncate(string value, int max) => value.Length > max ? value[..max] : value;
    }

    public class ExpireGroupOrdersHandler : IRequestHandler<ExpireGroupOrdersCommand, int>
    {
        private readonly IGroupOrderManager _manager;
        public ExpireGroupOrdersHandler(IGroupOrderManager manager) => _manager = manager;

        public Task<int> Handle(ExpireGroupOrdersCommand request, CancellationToken cancellationToken) => _manager.ExpireStaleAsync();
    }
}
