using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddFAQTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("966550dd-d1d6-44bf-a7dc-96b6ec31052e"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("a903863b-f0cc-4d98-8a6a-046b68dc5c66"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("d00a3136-c1fd-425c-ab6b-301c6f26c58f"));

            migrationBuilder.CreateTable(
                name: "FAQ",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Question = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Answer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FAQ", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("0f3952d1-a910-4bfe-8477-1aa842a0505c"), new DateTime(2026, 7, 4, 4, 36, 28, 596, DateTimeKind.Utc).AddTicks(1726), 500, "Gold" },
                    { new Guid("a1a9481b-f497-43a1-92e4-0cfa3f82f288"), new DateTime(2026, 7, 4, 4, 36, 28, 596, DateTimeKind.Utc).AddTicks(1727), 1000, "Diamond" },
                    { new Guid("c9b945be-374a-499c-a812-58419d71bb50"), new DateTime(2026, 7, 4, 4, 36, 28, 596, DateTimeKind.Utc).AddTicks(1724), 100, "Silver" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FAQ");

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("0f3952d1-a910-4bfe-8477-1aa842a0505c"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("a1a9481b-f497-43a1-92e4-0cfa3f82f288"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("c9b945be-374a-499c-a812-58419d71bb50"));

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("966550dd-d1d6-44bf-a7dc-96b6ec31052e"), new DateTime(2026, 7, 4, 1, 32, 59, 227, DateTimeKind.Utc).AddTicks(4615), 100, "Silver" },
                    { new Guid("a903863b-f0cc-4d98-8a6a-046b68dc5c66"), new DateTime(2026, 7, 4, 1, 32, 59, 227, DateTimeKind.Utc).AddTicks(4618), 1000, "Diamond" },
                    { new Guid("d00a3136-c1fd-425c-ab6b-301c6f26c58f"), new DateTime(2026, 7, 4, 1, 32, 59, 227, DateTimeKind.Utc).AddTicks(4617), 500, "Gold" }
                });
        }
    }
}
