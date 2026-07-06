using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddSepayPaymentIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("0b22ea39-cc1d-4141-82f3-bfd3881c0267"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("68876806-6642-472a-aa91-562e40ac08f1"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("d0d24f71-3b51-437b-a42d-ad5bbc900e80"));

            migrationBuilder.AddColumn<string>(
                name: "ExternalTransactionId",
                table: "PAYMENT_SESSION",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceNumber",
                table: "PAYMENT_SESSION",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SepayOrderId",
                table: "PAYMENT_SESSION",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SepayPaymentMethod",
                table: "PAYMENT_SESSION",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SEPAY_WEBHOOK_LOG",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RawPayload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaymentSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SEPAY_WEBHOOK_LOG", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("22a28d43-da43-4703-a005-c3c934994f03"), new DateTime(2026, 7, 6, 6, 50, 15, 990, DateTimeKind.Utc).AddTicks(2907), 100, "Silver" },
                    { new Guid("3be45954-ad43-484c-aba4-a735a917cf83"), new DateTime(2026, 7, 6, 6, 50, 15, 990, DateTimeKind.Utc).AddTicks(2909), 500, "Gold" },
                    { new Guid("dc5ffff5-3599-4dc2-bc42-9e8583d2e459"), new DateTime(2026, 7, 6, 6, 50, 15, 990, DateTimeKind.Utc).AddTicks(2911), 1000, "Diamond" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PAYMENT_SESSION_InvoiceNumber",
                table: "PAYMENT_SESSION",
                column: "InvoiceNumber",
                unique: true,
                filter: "[InvoiceNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SEPAY_WEBHOOK_LOG_EventKey",
                table: "SEPAY_WEBHOOK_LOG",
                column: "EventKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SEPAY_WEBHOOK_LOG");

            migrationBuilder.DropIndex(
                name: "IX_PAYMENT_SESSION_InvoiceNumber",
                table: "PAYMENT_SESSION");

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

            migrationBuilder.DropColumn(
                name: "ExternalTransactionId",
                table: "PAYMENT_SESSION");

            migrationBuilder.DropColumn(
                name: "InvoiceNumber",
                table: "PAYMENT_SESSION");

            migrationBuilder.DropColumn(
                name: "SepayOrderId",
                table: "PAYMENT_SESSION");

            migrationBuilder.DropColumn(
                name: "SepayPaymentMethod",
                table: "PAYMENT_SESSION");

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("0b22ea39-cc1d-4141-82f3-bfd3881c0267"), new DateTime(2026, 7, 6, 4, 26, 18, 311, DateTimeKind.Utc).AddTicks(2001), 100, "Silver" },
                    { new Guid("68876806-6642-472a-aa91-562e40ac08f1"), new DateTime(2026, 7, 6, 4, 26, 18, 311, DateTimeKind.Utc).AddTicks(2006), 1000, "Diamond" },
                    { new Guid("d0d24f71-3b51-437b-a42d-ad5bbc900e80"), new DateTime(2026, 7, 6, 4, 26, 18, 311, DateTimeKind.Utc).AddTicks(2004), 500, "Gold" }
                });
        }
    }
}
