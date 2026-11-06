using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.API.Data
{
    /// <summary>
    /// Seeds default campuses (FPTU Hòa Lạc, ĐHQG TP.HCM) for group ordering. Only inserts campuses whose code is missing,
    /// so admin edits are never overwritten.
    /// </summary>
    public static class CampusSeeder
    {
        private record B(string Code, string Name, string ShortName, CampusBuildingType Type, string? Zone,
            double X, double Y, double W, double H, int Floors = 1, string? DropPoint = null, string? Description = null);

        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ShoppingFoodContext>();

            var existingCodes = await context.Campuses.Select(c => c.Code).ToListAsync();

            if (!existingCodes.Contains("FPTU-HL"))
                context.Campuses.Add(BuildFptu());
            if (!existingCodes.Contains("VNU-HCM"))
                context.Campuses.Add(BuildVnuHcm());

            if (context.ChangeTracker.HasChanges())
            {
                await context.SaveChangesAsync();
                Console.WriteLine("[CampusSeeder] Seeded default campuses for group ordering.");
            }
        }

        private static Campus BuildFptu()
        {
            const string dormZone = "Khu Ký túc xá (Dom A - Dom H)";
            const string lectureZone = "Khu Giảng đường & Hiệu bộ (Alpha - Epsilon)";

            var campus = new Campus
            {
                Id = Guid.NewGuid(),
                Code = "FPTU-HL",
                Name = "Đại học FPT Hòa Lạc",
                ShortName = "FPTU",
                Address = "Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Thạch Thất, Hà Nội",
                Description = "Gom đơn nội khu FPTU: ship cổng miễn phụ phí, giao sảnh Dom/Tòa hoặc giao tận phòng.",
                Latitude = 21.0133,
                Longitude = 105.5268,
                SortOrder = 1
            };

            var dorms = new List<B>();
            var letters = new[] { "A", "B", "C", "D", "E", "F", "G", "H" };
            for (var i = 0; i < letters.Length; i++)
            {
                var col = i % 4;
                var row = i / 4;
                var l = letters[i];
                dorms.Add(new B($"DOM-{l}", $"KTX Dom {l}", $"Dom {l}", CampusBuildingType.Dormitory, dormZone,
                    7 + col * 11.5, 27 + row * 13, 10, 10, 6, $"Bàn lễ tân Tầng 1 - KTX Dom {l}", "KTX sinh viên"));
            }

            var others = new List<B>
            {
                new("GAMMA", "Tòa Gamma (Giảng đường & Lab)", "Tòa Gamma", CampusBuildingType.Lecture, lectureZone, 57, 26, 16, 10, 5, "Sảnh chính Tầng 1 - Tòa Gamma", "Giảng đường & Lab"),
                new("DELTA", "Tòa Delta (Hội trường)", "Tòa Delta", CampusBuildingType.Lecture, lectureZone, 77, 26, 15, 10, 4, "Sảnh chính Tầng 1 - Tòa Delta", "Hội trường"),
                new("BETA", "Tòa Beta (Giảng đường B)", "Tòa Beta", CampusBuildingType.Lecture, lectureZone, 55, 45, 15, 10, 5, "Sảnh chính Tầng 1 - Tòa Beta", "Giảng đường B"),
                new("ALPHA", "Tòa Alpha (Hiệu bộ & Trống Đồng)", "Tòa Alpha", CampusBuildingType.Lecture, lectureZone, 74, 49, 18, 11, 6, "Sảnh chính Trống Đồng Tầng 1 - Tòa Alpha", "Hiệu bộ & Trống Đồng"),
                new("EPSILON", "Tòa Epsilon (Thư viện & Innovation)", "Tòa Epsilon", CampusBuildingType.Lecture, lectureZone, 55, 66, 17, 11, 4, "Cửa ra vào Tầng 1 - Tòa Epsilon", "Thư viện & Lab"),
                new("GATE-2", "Cổng 2 (Cổng KTX)", "Cổng 2", CampusBuildingType.Gate, null, 7, 8, 12, 9, 1, "Cổng số 2 - phía KTX Tân Xã", "Cổng KTX"),
                new("GATE-1", "Cổng 1 (Cổng chính)", "Cổng 1", CampusBuildingType.Gate, null, 81, 76, 13, 9, 1, "Cổng số 1 - Cổng chính Trống Đồng", "Cổng chính"),
                new("FIELD", "Sân bóng FPTU", "Sân bóng", CampusBuildingType.Landmark, null, 7, 56, 24, 17),
                new("LAKE", "Hồ Sen FPTU", "Hồ Sen", CampusBuildingType.Landmark, null, 34, 59, 17, 12, 1, null, "Quảng trường sinh viên"),
                new("ROAD", "Đại lộ Thăng Long — Khu CNC Hòa Lạc", "Đại lộ Thăng Long", CampusBuildingType.Landmark, null, 2, 89, 96, 6),
            };

            AddBuildings(campus, dorms.Concat(others));
            return campus;
        }

        private static Campus BuildVnuHcm()
        {
            const string dormA = "KTX Khu A (Linh Trung)";
            const string dormB = "KTX Khu B (Đông Hòa)";
            const string schools = "Khu các trường thành viên";

            var campus = new Campus
            {
                Id = Guid.NewGuid(),
                Code = "VNU-HCM",
                Name = "Đại học Quốc gia TP.HCM (Làng Đại học)",
                ShortName = "ĐHQG",
                Address = "Khu phố 6, Linh Trung, Thủ Đức, TP. Hồ Chí Minh",
                Description = "Gom đơn KTX khu A/B và các trường thành viên ĐHQG-HCM.",
                Latitude = 10.8751,
                Longitude = 106.8007,
                SortOrder = 2
            };

            var list = new List<B>();
            var aBlocks = new[] { "A1", "A2", "A3", "A4" };
            for (var i = 0; i < aBlocks.Length; i++)
            {
                list.Add(new B($"KTXA-{aBlocks[i]}", $"KTX Khu A - Tòa {aBlocks[i]}", $"Tòa {aBlocks[i]}", CampusBuildingType.Dormitory, dormA,
                    6 + (i % 2) * 11.5, 24 + (i / 2) * 13, 10, 10, 6, $"Phòng trực Tầng 1 - Tòa {aBlocks[i]}", "KTX Khu A"));
            }

            var bBlocks = new[] { "BA1", "BA2", "BB1", "BB2", "BC1", "BC2", "BD1", "BD2" };
            for (var i = 0; i < bBlocks.Length; i++)
            {
                list.Add(new B($"KTXB-{bBlocks[i]}", $"KTX Khu B - Tòa {bBlocks[i]}", $"Tòa {bBlocks[i]}", CampusBuildingType.Dormitory, dormB,
                    56 + (i % 4) * 10.5, 10 + (i / 4) * 13, 9, 10, 12, $"Sảnh thang máy Tầng 1 - Tòa {bBlocks[i]}", "KTX Khu B"));
            }

            list.AddRange(new[]
            {
                new B("BK", "ĐH Bách Khoa (Cơ sở Dĩ An)", "Bách Khoa", CampusBuildingType.Lecture, schools, 30, 50, 15, 10, 5, "Sảnh nhà H1 - ĐH Bách Khoa", "Giảng đường H1, H2, H3"),
                new B("KHTN", "ĐH Khoa học Tự nhiên (Linh Trung)", "KHTN", CampusBuildingType.Lecture, schools, 48, 50, 15, 10, 5, "Sảnh chính Tầng 1 - ĐH KHTN", "Cơ sở Linh Trung"),
                new B("UIT", "ĐH Công nghệ Thông tin (UIT)", "UIT", CampusBuildingType.Lecture, schools, 66, 50, 14, 10, 7, "Sảnh tòa A - ĐH CNTT", "Tòa A, B, C, E"),
                new B("IU", "ĐH Quốc tế", "Quốc tế", CampusBuildingType.Lecture, schools, 30, 66, 15, 10, 5, "Sảnh chính - ĐH Quốc tế"),
                new B("USSH", "ĐH KHXH&NV (Linh Trung)", "KHXH&NV", CampusBuildingType.Lecture, schools, 48, 66, 15, 10, 5, "Sảnh chính - ĐH KHXH&NV"),
                new B("UEL", "ĐH Kinh tế - Luật", "Kinh tế - Luật", CampusBuildingType.Lecture, schools, 66, 66, 14, 10, 7, "Sảnh tòa A - ĐH Kinh tế - Luật"),
                new B("GATE-A", "Cổng KTX Khu A", "Cổng khu A", CampusBuildingType.Gate, null, 6, 8, 12, 9, 1, "Cổng chính KTX khu A"),
                new B("GATE-B", "Cổng KTX Khu B", "Cổng khu B", CampusBuildingType.Gate, null, 84, 38, 12, 9, 1, "Cổng chính KTX khu B"),
                new B("NVH", "Nhà Văn hóa Sinh viên", "Nhà Văn hóa SV", CampusBuildingType.Landmark, null, 6, 52, 20, 13),
                new B("LAKE", "Hồ Đá", "Hồ Đá", CampusBuildingType.Landmark, null, 82, 56, 14, 14),
                new B("ROAD", "Xa lộ Hà Nội — Làng Đại học Thủ Đức", "Xa lộ Hà Nội", CampusBuildingType.Landmark, null, 2, 89, 96, 6),
            });

            AddBuildings(campus, list);
            return campus;
        }

        private static void AddBuildings(Campus campus, IEnumerable<B> items)
        {
            var order = 0;
            foreach (var b in items)
            {
                campus.Buildings.Add(new CampusBuilding
                {
                    Id = Guid.NewGuid(),
                    CampusId = campus.Id,
                    Code = b.Code,
                    Name = b.Name,
                    ShortName = b.ShortName,
                    BuildingType = b.Type,
                    Zone = b.Zone,
                    MapX = b.X,
                    MapY = b.Y,
                    MapWidth = b.W,
                    MapHeight = b.H,
                    Floors = b.Floors,
                    DropPoint = b.DropPoint,
                    Description = b.Description,
                    AllowRoomDelivery = b.Type == CampusBuildingType.Dormitory || b.Type == CampusBuildingType.Lecture,
                    Latitude = campus.Latitude,
                    Longitude = campus.Longitude,
                    SortOrder = order++
                });
            }
        }
    }
}
