using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.GroupOrders;

namespace ShoppingFood.Application.Features.Campuses
{
    public class GetCampusesQuery : IRequest<ApiResponse>
    {
        public bool IncludeInactive { get; set; }
    }

    public class UpsertCampusCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid? Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int MinGroupMembers { get; set; } = 3;
        public int MaxGroupMembers { get; set; } = 10;
        public decimal GroupBaseShippingFee { get; set; } = 15000;
        public decimal LobbySurchargePerMember { get; set; } = 3000;
        public decimal RoomSurchargePerMember { get; set; } = 8000;
        public decimal SingleRoomDeliveryFee { get; set; } = 25000;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class DeleteCampusCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
    }

    public class UpsertCampusBuildingCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid? Id { get; set; }
        public Guid CampusId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public string BuildingType { get; set; } = nameof(CampusBuildingType.Dormitory);
        public string? Zone { get; set; }
        public string? Description { get; set; }
        public string? DropPoint { get; set; }
        public int Floors { get; set; } = 1;
        public bool AllowRoomDelivery { get; set; } = true;
        public double MapX { get; set; }
        public double MapY { get; set; }
        public double MapWidth { get; set; } = 10;
        public double MapHeight { get; set; } = 8;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class DeleteCampusBuildingCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
    }

    internal static class CampusMapping
    {
        public static CampusBuildingDto ToDto(CampusBuilding b, int openGroups) => new()
        {
            Id = b.Id,
            CampusId = b.CampusId,
            Code = b.Code,
            Name = b.Name,
            ShortName = b.ShortName,
            BuildingType = b.BuildingType.ToString(),
            Zone = b.Zone,
            Description = b.Description,
            DropPoint = b.DropPoint,
            Floors = b.Floors,
            AllowRoomDelivery = b.AllowRoomDelivery,
            MapX = b.MapX,
            MapY = b.MapY,
            MapWidth = b.MapWidth,
            MapHeight = b.MapHeight,
            Latitude = b.Latitude,
            Longitude = b.Longitude,
            IsActive = b.IsActive,
            SortOrder = b.SortOrder,
            OpenGroupCount = openGroups
        };

        public static CampusDto ToDto(Campus c, IReadOnlyDictionary<Guid, int> openByBuilding, bool includeInactive) => new()
        {
            Id = c.Id,
            Code = c.Code,
            Name = c.Name,
            ShortName = c.ShortName,
            Address = c.Address,
            Description = c.Description,
            Latitude = c.Latitude,
            Longitude = c.Longitude,
            MinGroupMembers = c.MinGroupMembers,
            MaxGroupMembers = c.MaxGroupMembers,
            GroupBaseShippingFee = c.GroupBaseShippingFee,
            LobbySurchargePerMember = c.LobbySurchargePerMember,
            RoomSurchargePerMember = c.RoomSurchargePerMember,
            SingleRoomDeliveryFee = c.SingleRoomDeliveryFee,
            IsActive = c.IsActive,
            SortOrder = c.SortOrder,
            OpenGroupCount = c.Buildings.Sum(b => openByBuilding.TryGetValue(b.Id, out var n) ? n : 0),
            Buildings = c.Buildings
                .Where(b => includeInactive || b.IsActive)
                .OrderBy(b => b.SortOrder).ThenBy(b => b.Name)
                .Select(b => ToDto(b, openByBuilding.TryGetValue(b.Id, out var n) ? n : 0))
                .ToList()
        };
    }

    public class GetCampusesHandler : IRequestHandler<GetCampusesQuery, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        public GetCampusesHandler(ShoppingFoodContext db) => _db = db;

        public async Task<ApiResponse> Handle(GetCampusesQuery request, CancellationToken cancellationToken)
        {
            var campuses = await _db.Campuses
                .Include(c => c.Buildings)
                .Where(c => request.IncludeInactive || c.IsActive)
                .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;
            var openByBuilding = await _db.GroupOrders
                .Where(g => g.Status == GroupOrderStatus.Open && g.ExpiresAt > now)
                .GroupBy(g => g.BuildingId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

            return ApiResponse.Success(campuses.Select(c => CampusMapping.ToDto(c, openByBuilding, request.IncludeInactive)).ToList());
        }
    }

    public class UpsertCampusHandler : IRequestHandler<UpsertCampusCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        public UpsertCampusHandler(ShoppingFoodContext db) => _db = db;

        public async Task<ApiResponse> Handle(UpsertCampusCommand request, CancellationToken cancellationToken)
        {
            var code = request.Code.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Address))
                return ApiResponse.Failure(400, "Vui lòng nhập mã, tên và địa chỉ trường.");
            if (request.MinGroupMembers < 2 || request.MaxGroupMembers < request.MinGroupMembers)
                return ApiResponse.Failure(400, "Số người tối thiểu phải từ 2 và không lớn hơn số người tối đa.");
            if (request.GroupBaseShippingFee < 0 || request.LobbySurchargePerMember < 0 || request.RoomSurchargePerMember < 0 || request.SingleRoomDeliveryFee < 0)
                return ApiResponse.Failure(400, "Phí ship không được âm.");
            if (await _db.Campuses.AnyAsync(c => c.Code == code && c.Id != request.Id, cancellationToken))
                return ApiResponse.Failure(400, "Mã trường đã tồn tại.");

            Campus? campus;
            if (request.Id.HasValue)
            {
                campus = await _db.Campuses.FirstOrDefaultAsync(c => c.Id == request.Id.Value, cancellationToken);
                if (campus == null) return ApiResponse.Failure(404, "Không tìm thấy trường.");
            }
            else
            {
                campus = new Campus { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
                _db.Campuses.Add(campus);
            }

            campus.Code = code;
            campus.Name = request.Name.Trim();
            campus.ShortName = string.IsNullOrWhiteSpace(request.ShortName) ? code : request.ShortName.Trim();
            campus.Address = request.Address.Trim();
            campus.Description = request.Description?.Trim();
            campus.Latitude = request.Latitude;
            campus.Longitude = request.Longitude;
            campus.MinGroupMembers = request.MinGroupMembers;
            campus.MaxGroupMembers = request.MaxGroupMembers;
            campus.GroupBaseShippingFee = request.GroupBaseShippingFee;
            campus.LobbySurchargePerMember = request.LobbySurchargePerMember;
            campus.RoomSurchargePerMember = request.RoomSurchargePerMember;
            campus.SingleRoomDeliveryFee = request.SingleRoomDeliveryFee;
            campus.IsActive = request.IsActive;
            campus.SortOrder = request.SortOrder;
            campus.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);
            return ApiResponse.Success(new { campus.Id }, request.Id.HasValue ? "Đã cập nhật trường." : "Đã thêm trường.");
        }
    }

    public class DeleteCampusHandler : IRequestHandler<DeleteCampusCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        public DeleteCampusHandler(ShoppingFoodContext db) => _db = db;

        public async Task<ApiResponse> Handle(DeleteCampusCommand request, CancellationToken cancellationToken)
        {
            var campus = await _db.Campuses.Include(c => c.Buildings).FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
            if (campus == null) return ApiResponse.Failure(404, "Không tìm thấy trường.");

            if (await _db.GroupOrders.AnyAsync(g => g.CampusId == campus.Id, cancellationToken))
            {
                campus.IsActive = false;
                campus.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
                return ApiResponse.Success(null, "Trường đã có lịch sử gom đơn nên được ẩn thay vì xóa.");
            }

            _db.Campuses.Remove(campus);
            await _db.SaveChangesAsync(cancellationToken);
            return ApiResponse.Success(null, "Đã xóa trường.");
        }
    }

    public class UpsertCampusBuildingHandler : IRequestHandler<UpsertCampusBuildingCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        public UpsertCampusBuildingHandler(ShoppingFoodContext db) => _db = db;

        public async Task<ApiResponse> Handle(UpsertCampusBuildingCommand request, CancellationToken cancellationToken)
        {
            var code = request.Code.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(request.Name))
                return ApiResponse.Failure(400, "Vui lòng nhập mã và tên tòa nhà.");
            if (!Enum.TryParse<CampusBuildingType>(request.BuildingType, true, out var type))
                return ApiResponse.Failure(400, "Loại tòa nhà không hợp lệ.");
            if (request.MapWidth <= 0 || request.MapHeight <= 0 || request.MapX < 0 || request.MapY < 0
                || request.MapX + request.MapWidth > 100.01 || request.MapY + request.MapHeight > 100.01)
                return ApiResponse.Failure(400, "Vị trí trên sơ đồ phải nằm trong khung 0–100%.");
            if (request.Floors < 1)
                return ApiResponse.Failure(400, "Số tầng phải từ 1 trở lên.");
            if (!await _db.Campuses.AnyAsync(c => c.Id == request.CampusId, cancellationToken))
                return ApiResponse.Failure(404, "Không tìm thấy trường.");
            if (await _db.CampusBuildings.AnyAsync(b => b.CampusId == request.CampusId && b.Code == code && b.Id != request.Id, cancellationToken))
                return ApiResponse.Failure(400, "Mã tòa nhà đã tồn tại trong trường này.");

            CampusBuilding? building;
            if (request.Id.HasValue)
            {
                building = await _db.CampusBuildings.FirstOrDefaultAsync(b => b.Id == request.Id.Value, cancellationToken);
                if (building == null) return ApiResponse.Failure(404, "Không tìm thấy tòa nhà.");
            }
            else
            {
                building = new CampusBuilding { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow };
                _db.CampusBuildings.Add(building);
            }

            building.CampusId = request.CampusId;
            building.Code = code;
            building.Name = request.Name.Trim();
            building.ShortName = string.IsNullOrWhiteSpace(request.ShortName) ? request.Name.Trim() : request.ShortName.Trim();
            building.BuildingType = type;
            building.Zone = request.Zone?.Trim();
            building.Description = request.Description?.Trim();
            building.DropPoint = request.DropPoint?.Trim();
            building.Floors = request.Floors;
            building.AllowRoomDelivery = request.AllowRoomDelivery && type is CampusBuildingType.Dormitory or CampusBuildingType.Lecture;
            building.MapX = Math.Round(request.MapX, 2);
            building.MapY = Math.Round(request.MapY, 2);
            building.MapWidth = Math.Round(request.MapWidth, 2);
            building.MapHeight = Math.Round(request.MapHeight, 2);
            building.Latitude = request.Latitude;
            building.Longitude = request.Longitude;
            building.IsActive = request.IsActive;
            building.SortOrder = request.SortOrder;
            building.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);
            return ApiResponse.Success(CampusMapping.ToDto(building, 0), request.Id.HasValue ? "Đã cập nhật tòa nhà." : "Đã thêm tòa nhà.");
        }
    }

    public class DeleteCampusBuildingHandler : IRequestHandler<DeleteCampusBuildingCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _db;
        public DeleteCampusBuildingHandler(ShoppingFoodContext db) => _db = db;

        public async Task<ApiResponse> Handle(DeleteCampusBuildingCommand request, CancellationToken cancellationToken)
        {
            var building = await _db.CampusBuildings.FirstOrDefaultAsync(b => b.Id == request.Id, cancellationToken);
            if (building == null) return ApiResponse.Failure(404, "Không tìm thấy tòa nhà.");

            if (await _db.GroupOrders.AnyAsync(g => g.BuildingId == building.Id, cancellationToken))
            {
                building.IsActive = false;
                building.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
                return ApiResponse.Success(null, "Tòa nhà đã có lịch sử gom đơn nên được ẩn thay vì xóa.");
            }

            _db.CampusBuildings.Remove(building);
            await _db.SaveChangesAsync(cancellationToken);
            return ApiResponse.Success(null, "Đã xóa tòa nhà.");
        }
    }
}
