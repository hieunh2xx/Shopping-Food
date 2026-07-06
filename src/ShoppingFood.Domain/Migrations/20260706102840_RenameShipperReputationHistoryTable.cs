using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class RenameShipperReputationHistoryTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShipperReputationHistories_ORDER_OrderId",
                table: "ShipperReputationHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_ShipperReputationHistories_SHIPPER_PROFILE_ShipperProfileId",
                table: "ShipperReputationHistories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShipperReputationHistories",
                table: "ShipperReputationHistories");

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

            migrationBuilder.RenameTable(
                name: "ShipperReputationHistories",
                newName: "SHIPPER_REPUTATION_HISTORY");

            migrationBuilder.RenameIndex(
                name: "IX_ShipperReputationHistories_ShipperProfileId",
                table: "SHIPPER_REPUTATION_HISTORY",
                newName: "IX_SHIPPER_REPUTATION_HISTORY_ShipperProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_ShipperReputationHistories_OrderId",
                table: "SHIPPER_REPUTATION_HISTORY",
                newName: "IX_SHIPPER_REPUTATION_HISTORY_OrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SHIPPER_REPUTATION_HISTORY",
                table: "SHIPPER_REPUTATION_HISTORY",
                column: "Id");

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("064f97f4-085f-4038-9386-1c0de84c0de6"), new DateTime(2026, 7, 6, 10, 28, 39, 758, DateTimeKind.Utc).AddTicks(465), 100, "Silver" },
                    { new Guid("443f3dfd-669c-4957-a642-ca9733c1e298"), new DateTime(2026, 7, 6, 10, 28, 39, 758, DateTimeKind.Utc).AddTicks(468), 1000, "Diamond" },
                    { new Guid("ca877c8b-e167-4430-b964-523d39381865"), new DateTime(2026, 7, 6, 10, 28, 39, 758, DateTimeKind.Utc).AddTicks(467), 500, "Gold" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_SHIPPER_REPUTATION_HISTORY_ORDER_OrderId",
                table: "SHIPPER_REPUTATION_HISTORY",
                column: "OrderId",
                principalTable: "ORDER",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SHIPPER_REPUTATION_HISTORY_SHIPPER_PROFILE_ShipperProfileId",
                table: "SHIPPER_REPUTATION_HISTORY",
                column: "ShipperProfileId",
                principalTable: "SHIPPER_PROFILE",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SHIPPER_REPUTATION_HISTORY_ORDER_OrderId",
                table: "SHIPPER_REPUTATION_HISTORY");

            migrationBuilder.DropForeignKey(
                name: "FK_SHIPPER_REPUTATION_HISTORY_SHIPPER_PROFILE_ShipperProfileId",
                table: "SHIPPER_REPUTATION_HISTORY");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SHIPPER_REPUTATION_HISTORY",
                table: "SHIPPER_REPUTATION_HISTORY");

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("064f97f4-085f-4038-9386-1c0de84c0de6"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("443f3dfd-669c-4957-a642-ca9733c1e298"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("ca877c8b-e167-4430-b964-523d39381865"));

            migrationBuilder.RenameTable(
                name: "SHIPPER_REPUTATION_HISTORY",
                newName: "ShipperReputationHistories");

            migrationBuilder.RenameIndex(
                name: "IX_SHIPPER_REPUTATION_HISTORY_ShipperProfileId",
                table: "ShipperReputationHistories",
                newName: "IX_ShipperReputationHistories_ShipperProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_SHIPPER_REPUTATION_HISTORY_OrderId",
                table: "ShipperReputationHistories",
                newName: "IX_ShipperReputationHistories_OrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShipperReputationHistories",
                table: "ShipperReputationHistories",
                column: "Id");

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("29821e80-dacf-465a-9485-81f9f441f64f"), new DateTime(2026, 7, 6, 8, 58, 37, 356, DateTimeKind.Utc).AddTicks(6659), 500, "Gold" },
                    { new Guid("91f778a4-988f-46c1-89a2-2ee774427978"), new DateTime(2026, 7, 6, 8, 58, 37, 356, DateTimeKind.Utc).AddTicks(6656), 100, "Silver" },
                    { new Guid("b2583ce0-2615-4741-a880-f71e66e54f82"), new DateTime(2026, 7, 6, 8, 58, 37, 356, DateTimeKind.Utc).AddTicks(6660), 1000, "Diamond" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_ShipperReputationHistories_ORDER_OrderId",
                table: "ShipperReputationHistories",
                column: "OrderId",
                principalTable: "ORDER",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ShipperReputationHistories_SHIPPER_PROFILE_ShipperProfileId",
                table: "ShipperReputationHistories",
                column: "ShipperProfileId",
                principalTable: "SHIPPER_PROFILE",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
