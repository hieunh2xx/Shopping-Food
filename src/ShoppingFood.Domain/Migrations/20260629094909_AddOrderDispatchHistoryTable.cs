using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderDispatchHistoryTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("76832172-1b3f-421e-9857-a5202b3670cd"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("822e1db9-b64c-40d0-b5ab-ceff0277cee7"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("a53c9627-d883-4b55-b43c-cc8f18f2efa7"));

            migrationBuilder.CreateTable(
                name: "ORDER_DISPATCH_HISTORY",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActorName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActorRole = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetShipperId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TargetShipperName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ORDER_DISPATCH_HISTORY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ORDER_DISPATCH_HISTORY_ORDER_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDER",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("3326debb-92e5-492d-b143-683f2184a72a"), new DateTime(2026, 6, 29, 9, 49, 8, 437, DateTimeKind.Utc).AddTicks(9875), 1000, "Diamond" },
                    { new Guid("e49e9708-f59c-49bd-8a9d-ca24b12d12cf"), new DateTime(2026, 6, 29, 9, 49, 8, 437, DateTimeKind.Utc).AddTicks(9871), 100, "Silver" },
                    { new Guid("e99ab56e-f88f-4681-869a-c4a1bc5c8318"), new DateTime(2026, 6, 29, 9, 49, 8, 437, DateTimeKind.Utc).AddTicks(9873), 500, "Gold" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ORDER_DISPATCH_HISTORY_OrderId",
                table: "ORDER_DISPATCH_HISTORY",
                column: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ORDER_DISPATCH_HISTORY");

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("3326debb-92e5-492d-b143-683f2184a72a"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("e49e9708-f59c-49bd-8a9d-ca24b12d12cf"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("e99ab56e-f88f-4681-869a-c4a1bc5c8318"));

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("76832172-1b3f-421e-9857-a5202b3670cd"), new DateTime(2026, 6, 29, 7, 29, 36, 118, DateTimeKind.Utc).AddTicks(2155), 500, "Gold" },
                    { new Guid("822e1db9-b64c-40d0-b5ab-ceff0277cee7"), new DateTime(2026, 6, 29, 7, 29, 36, 118, DateTimeKind.Utc).AddTicks(2160), 1000, "Diamond" },
                    { new Guid("a53c9627-d883-4b55-b43c-cc8f18f2efa7"), new DateTime(2026, 6, 29, 7, 29, 36, 118, DateTimeKind.Utc).AddTicks(2153), 100, "Silver" }
                });
        }
    }
}
