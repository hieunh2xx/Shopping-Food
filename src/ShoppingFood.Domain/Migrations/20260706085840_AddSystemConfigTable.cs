using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemConfigTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("47d2ce7e-7193-4691-8696-9d7d578736e8"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("7f51da28-42d4-497a-8a99-0a191d47624a"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("d92880ca-d7d5-4ec8-a575-f05a250e8f52"));

            migrationBuilder.CreateTable(
                name: "SYSTEM_CONFIG",
                columns: table => new
                {
                    Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SYSTEM_CONFIG", x => x.Key);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("29821e80-dacf-465a-9485-81f9f441f64f"), new DateTime(2026, 7, 6, 8, 58, 37, 356, DateTimeKind.Utc).AddTicks(6659), 500, "Gold" },
                    { new Guid("91f778a4-988f-46c1-89a2-2ee774427978"), new DateTime(2026, 7, 6, 8, 58, 37, 356, DateTimeKind.Utc).AddTicks(6656), 100, "Silver" },
                    { new Guid("b2583ce0-2615-4741-a880-f71e66e54f82"), new DateTime(2026, 7, 6, 8, 58, 37, 356, DateTimeKind.Utc).AddTicks(6660), 1000, "Diamond" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SYSTEM_CONFIG");

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("29821e80-dacf-465a-9485-81f9f441f64f"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("91f778a4-988f-46c1-89a2-2ee774427978"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("b2583ce0-2615-4741-a880-f71e66e54f82"));

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("47d2ce7e-7193-4691-8696-9d7d578736e8"), new DateTime(2026, 7, 6, 2, 33, 43, 589, DateTimeKind.Utc).AddTicks(1001), 500, "Gold" },
                    { new Guid("7f51da28-42d4-497a-8a99-0a191d47624a"), new DateTime(2026, 7, 6, 2, 33, 43, 589, DateTimeKind.Utc).AddTicks(999), 100, "Silver" },
                    { new Guid("d92880ca-d7d5-4ec8-a575-f05a250e8f52"), new DateTime(2026, 7, 6, 2, 33, 43, 589, DateTimeKind.Utc).AddTicks(1003), 1000, "Diamond" }
                });
        }
    }
}
