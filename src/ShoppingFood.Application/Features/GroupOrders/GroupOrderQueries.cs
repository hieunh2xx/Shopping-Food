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
    public class GetOpenGroupOrdersQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public Guid? CampusId { get; set; }
        public Guid? BuildingId { get; set; }
        public Guid? RestaurantId { get; set; }
        public int Take { get; set; } = 30;
    }

    public class GetMyGroupOrdersQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
    }

    public class GetGroupOrderDetailQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public Guid? Id { get; set; }
        public string? Code { get; set; }
    }

    public class GetGroupOrderRestaurantsQuery : IRequest<ApiResponse>
    {
        public Guid CampusId { get; set; }
    }

    public class GetGroupOrderMenuQuery : IRequest<ApiResponse>
    {
        public Guid RestaurantId { get; set; }
    }

    internal static class GroupOrderListQuery
    {
        public static IQueryable<GroupOrder> WithSummaryIncludes(this IQueryable<GroupOrder> query) => query
            .Include(g => g.Campus)
            .Include(g => g.Building)
            .Include(g => g.Restaurant)
            .Include(g => g.Order)
            .Include(g => g.HostUser).ThenInclude(u => u.Profile)
            .Include(g => g.Members).ThenInclude(m => m.Items)
            .AsSplitQuery()
            .AsNoTracking();
    }

    public class GetOpenGroupOrdersHandler : IRequestHandler<GetOpenGroupOrdersQuery, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        private readonly IGroupOrderManager _manager;

        public GetOpenGroupOrdersHandler(ShoppingFoodContext db, IGroupOrderManager manager)
        {
            _db = db;
            _manager = manager;
        }

        public async Task<ApiResponse> Handle(GetOpenGroupOrdersQuery request, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            var query = _db.GroupOrders.Where(g => g.Status == GroupOrderStatus.Open && g.ExpiresAt > now
                && g.Members.Any(m => m.Items.Any()));
            if (request.CampusId.HasValue) query = query.Where(g => g.CampusId == request.CampusId.Value);
            if (request.BuildingId.HasValue) query = query.Where(g => g.BuildingId == request.BuildingId.Value);
            if (request.RestaurantId.HasValue) query = query.Where(g => g.RestaurantId == request.RestaurantId.Value);

            var groups = await query
                .OrderByDescending(g => g.CreatedAt)
                .Take(Math.Clamp(request.Take, 1, 100))
                .WithSummaryIncludes()
                .ToListAsync(cancellationToken);

            var data = groups.Select(g => _manager.ToSummary(g, request.CurrentUserId)).ToList();
            return ApiResponse.Success(data, total: data.Count);
        }
    }

    public class GetMyGroupOrdersHandler : IRequestHandler<GetMyGroupOrdersQuery, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        private readonly IGroupOrderManager _manager;

        public GetMyGroupOrdersHandler(ShoppingFoodContext db, IGroupOrderManager manager)
        {
            _db = db;
            _manager = manager;
        }

        public async Task<ApiResponse> Handle(GetMyGroupOrdersQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Vui lòng đăng nhập.");

            var userId = request.CurrentUserId.Value;
            var groups = await _db.GroupOrders
                .Where(g => g.Members.Any(m => m.UserAccountId == userId))
                .OrderByDescending(g => g.CreatedAt)
                .Take(30)
                .WithSummaryIncludes()
                .ToListAsync(cancellationToken);

            return ApiResponse.Success(groups.Select(g => _manager.ToSummary(g, userId)).ToList());
        }
    }

    public class GetGroupOrderDetailHandler : IRequestHandler<GetGroupOrderDetailQuery, ApiResponse>
    {
        private readonly IGroupOrderManager _manager;
        public GetGroupOrderDetailHandler(IGroupOrderManager manager) => _manager = manager;

        public async Task<ApiResponse> Handle(GetGroupOrderDetailQuery request, CancellationToken cancellationToken)
        {
            GroupOrder? group = null;
            if (request.Id.HasValue)
                group = await _manager.LoadAsync(request.Id.Value, tracking: false);
            else if (!string.IsNullOrWhiteSpace(request.Code))
                group = await _manager.LoadByCodeAsync(request.Code);

            if (group == null)
                return ApiResponse.Failure(404, "Không tìm thấy phòng gom đơn. Kiểm tra lại mã PIN.");

            return ApiResponse.Success(_manager.ToDetail(group, request.CurrentUserId));
        }
    }

    public class GetGroupOrderRestaurantsHandler : IRequestHandler<GetGroupOrderRestaurantsQuery, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        public GetGroupOrderRestaurantsHandler(ShoppingFoodContext db) => _db = db;

        public async Task<ApiResponse> Handle(GetGroupOrderRestaurantsQuery request, CancellationToken cancellationToken)
        {
            var campus = await _db.Campuses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == request.CampusId, cancellationToken);
            if (campus == null) return ApiResponse.Failure(404, "Không tìm thấy trường.");

            var restaurants = await _db.RestaurantProfiles
                .Where(r => r.Status == RestaurantStatus.Active)
                .Where(r => _db.Products.Any(p => p.RestaurantId == r.Id && p.Status == ProductStatus.Approved && !p.IsHidden && !p.IsDeleted))
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;
            var openGroups = await _db.GroupOrders
                .Where(g => g.CampusId == campus.Id && g.Status == GroupOrderStatus.Open && g.ExpiresAt > now)
                .GroupBy(g => g.RestaurantId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

            var data = restaurants
                .Select(r => new GroupOrderRestaurantDto
                {
                    Id = r.Id,
                    RestaurantName = r.RestaurantName,
                    Address = r.Address,
                    LogoUrl = r.LogoUrl,
                    AverageRating = r.AverageRating,
                    IsOpen = r.IsCurrentlyOpen(now),
                    DistanceKm = DistanceKm(campus.Latitude, campus.Longitude, r.Latitude, r.Longitude),
                    OpenGroupCount = openGroups.TryGetValue(r.Id, out var n) ? n : 0
                })
                .OrderByDescending(r => r.IsOpen)
                .ThenBy(r => r.DistanceKm ?? double.MaxValue)
                .ThenBy(r => r.RestaurantName)
                .ToList();

            return ApiResponse.Success(data);
        }

        private static double? DistanceKm(double? lat1, double? lon1, double? lat2, double? lon2)
        {
            if (!lat1.HasValue || !lon1.HasValue || !lat2.HasValue || !lon2.HasValue) return null;
            double dLat = (lat2.Value - lat1.Value) * Math.PI / 180.0;
            double dLon = (lon2.Value - lon1.Value) * Math.PI / 180.0;
            double a = Math.Pow(Math.Sin(dLat / 2), 2) + Math.Cos(lat1.Value * Math.PI / 180.0) * Math.Cos(lat2.Value * Math.PI / 180.0) * Math.Pow(Math.Sin(dLon / 2), 2);
            return Math.Round(6371.0 * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a)), 1);
        }
    }

    public class GetGroupOrderMenuHandler : IRequestHandler<GetGroupOrderMenuQuery, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        public GetGroupOrderMenuHandler(ShoppingFoodContext db) => _db = db;

        public async Task<ApiResponse> Handle(GetGroupOrderMenuQuery request, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            var products = await _db.Products
                .Where(p => p.RestaurantId == request.RestaurantId && p.Status == ProductStatus.Approved && !p.IsHidden && !p.IsDeleted)
                .Include(p => p.Images)
                .Include(p => p.ProductSizes)
                .Include(p => p.ProductToppings).ThenInclude(pt => pt.Topping)
                .AsSplitQuery()
                .AsNoTracking()
                .OrderBy(p => p.ItemName)
                .ToListAsync(cancellationToken);

            var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
            var categories = await _db.MenuCategories
                .Where(c => categoryIds.Contains(c.Id))
                .AsNoTracking()
                .ToDictionaryAsync(c => c.Id, c => c.Title, cancellationToken);

            var data = products
                .Where(p => p.StockStatus == StockStatus.InStock && p.IsCurrentlyAvailable(now))
                .Select(p => new GroupOrderMenuItemDto
            {
                Id = p.Id,
                ItemName = p.ItemName,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.Images.OrderByDescending(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault(),
                CategoryName = categories.TryGetValue(p.CategoryId, out var title) ? title : null,
                IsAvailable = true,
                Sizes = p.ProductSizes
                    .OrderBy(s => s.ExtraPrice)
                    .Select(s => new GroupOrderMenuSizeDto { SizeName = s.SizeName, ExtraPrice = s.ExtraPrice, IsDefault = s.IsDefault })
                    .ToList(),
                Toppings = p.ProductToppings
                    .Where(pt => pt.Topping != null && pt.Topping.IsAvailable)
                    .Select(pt => new GroupOrderMenuToppingDto { Name = pt.Topping.ToppingName, Price = pt.Topping.Price, IsAvailable = pt.Topping.IsAvailable })
                    .ToList()
            }).ToList();

            return ApiResponse.Success(data);
        }
    }
}
