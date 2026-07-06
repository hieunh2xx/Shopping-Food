using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperReputationHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("5ad454f3-3766-4ff7-a4cf-750a204d31f6"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("693ced57-8ab7-4806-8280-dea3d597e7ab"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("95c89a76-bd91-421c-bd0e-3640440da4cc"));

            migrationBuilder.CreateTable(
                name: "ShipperReputationHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShipperProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PointChange = table.Column<double>(type: "float", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipperReputationHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShipperReputationHistories_ORDER_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDER",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ShipperReputationHistories_SHIPPER_PROFILE_ShipperProfileId",
                        column: x => x.ShipperProfileId,
                        principalTable: "SHIPPER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("47d2ce7e-7193-4691-8696-9d7d578736e8"), new DateTime(2026, 7, 6, 2, 33, 43, 589, DateTimeKind.Utc).AddTicks(1001), 500, "Gold" },
                    { new Guid("7f51da28-42d4-497a-8a99-0a191d47624a"), new DateTime(2026, 7, 6, 2, 33, 43, 589, DateTimeKind.Utc).AddTicks(999), 100, "Silver" },
                    { new Guid("d92880ca-d7d5-4ec8-a575-f05a250e8f52"), new DateTime(2026, 7, 6, 2, 33, 43, 589, DateTimeKind.Utc).AddTicks(1003), 1000, "Diamond" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShipperReputationHistories_OrderId",
                table: "ShipperReputationHistories",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_ShipperReputationHistories_ShipperProfileId",
                table: "ShipperReputationHistories",
                column: "ShipperProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShipperReputationHistories");

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

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("5ad454f3-3766-4ff7-a4cf-750a204d31f6"), new DateTime(2026, 7, 6, 1, 54, 10, 753, DateTimeKind.Utc).AddTicks(8920), 1000, "Diamond" },
                    { new Guid("693ced57-8ab7-4806-8280-dea3d597e7ab"), new DateTime(2026, 7, 6, 1, 54, 10, 753, DateTimeKind.Utc).AddTicks(8919), 500, "Gold" },
                    { new Guid("95c89a76-bd91-421c-bd0e-3640440da4cc"), new DateTime(2026, 7, 6, 1, 54, 10, 753, DateTimeKind.Utc).AddTicks(8917), 100, "Silver" }
                });
        }
    }
}
