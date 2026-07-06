using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentQueueAndWebhookProcessed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("22a28d43-da43-4703-a005-c3c934994f03"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("3be45954-ad43-484c-aba4-a735a917cf83"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("dc5ffff5-3599-4dc2-bc42-9e8583d2e459"));

            migrationBuilder.AddColumn<bool>(
                name: "IsProcessed",
                table: "SEPAY_WEBHOOK_LOG",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessedAt",
                table: "SEPAY_WEBHOOK_LOG",
                type: "datetime2",
                nullable: true);

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("018a4448-4535-44db-b905-ca38b7183315"), new DateTime(2026, 7, 6, 6, 57, 1, 239, DateTimeKind.Utc).AddTicks(589), 500, "Gold" },
                    { new Guid("30fa7d4e-c028-433e-87b8-b1305fb989c6"), new DateTime(2026, 7, 6, 6, 57, 1, 239, DateTimeKind.Utc).AddTicks(591), 1000, "Diamond" },
                    { new Guid("e32310f6-1909-436a-9a78-49433a8e1c5c"), new DateTime(2026, 7, 6, 6, 57, 1, 239, DateTimeKind.Utc).AddTicks(587), 100, "Silver" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("018a4448-4535-44db-b905-ca38b7183315"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("30fa7d4e-c028-433e-87b8-b1305fb989c6"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("e32310f6-1909-436a-9a78-49433a8e1c5c"));

            migrationBuilder.DropColumn(
                name: "IsProcessed",
                table: "SEPAY_WEBHOOK_LOG");

            migrationBuilder.DropColumn(
                name: "ProcessedAt",
                table: "SEPAY_WEBHOOK_LOG");

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("22a28d43-da43-4703-a005-c3c934994f03"), new DateTime(2026, 7, 6, 6, 50, 15, 990, DateTimeKind.Utc).AddTicks(2907), 100, "Silver" },
                    { new Guid("3be45954-ad43-484c-aba4-a735a917cf83"), new DateTime(2026, 7, 6, 6, 50, 15, 990, DateTimeKind.Utc).AddTicks(2909), 500, "Gold" },
                    { new Guid("dc5ffff5-3599-4dc2-bc42-9e8583d2e459"), new DateTime(2026, 7, 6, 6, 50, 15, 990, DateTimeKind.Utc).AddTicks(2911), 1000, "Diamond" }
                });
        }
    }
}
