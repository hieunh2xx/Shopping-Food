using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class UpdateNotificationTypeToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("098757a3-d3bf-416e-ab37-b400ea45e8e6"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("cb4d8a92-0766-4722-9815-d7a654440a6e"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("e01b3c48-2450-4acc-affb-e8e27a8b1569"));

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("860a3d3f-895a-49cb-8d7c-d7c37cdbe94b"), new DateTime(2026, 6, 25, 9, 31, 19, 863, DateTimeKind.Utc).AddTicks(7704), 500, "Gold" },
                    { new Guid("8fd40f75-290f-499d-af02-fecd2d1b28a4"), new DateTime(2026, 6, 25, 9, 31, 19, 863, DateTimeKind.Utc).AddTicks(7705), 1000, "Diamond" },
                    { new Guid("e2546c1f-17c4-4911-8990-7b3b3a795edb"), new DateTime(2026, 6, 25, 9, 31, 19, 863, DateTimeKind.Utc).AddTicks(7699), 100, "Silver" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("860a3d3f-895a-49cb-8d7c-d7c37cdbe94b"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("8fd40f75-290f-499d-af02-fecd2d1b28a4"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("e2546c1f-17c4-4911-8990-7b3b3a795edb"));

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("098757a3-d3bf-416e-ab37-b400ea45e8e6"), new DateTime(2026, 6, 25, 6, 59, 7, 950, DateTimeKind.Utc).AddTicks(8683), 500, "Gold" },
                    { new Guid("cb4d8a92-0766-4722-9815-d7a654440a6e"), new DateTime(2026, 6, 25, 6, 59, 7, 950, DateTimeKind.Utc).AddTicks(8666), 100, "Silver" },
                    { new Guid("e01b3c48-2450-4acc-affb-e8e27a8b1569"), new DateTime(2026, 6, 25, 6, 59, 7, 950, DateTimeKind.Utc).AddTicks(8685), 1000, "Diamond" }
                });
        }
    }
}
