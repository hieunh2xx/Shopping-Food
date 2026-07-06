using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentFinanceTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("4aa79c2e-9085-4823-9909-55de5d4a6f83"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("56343ff0-e9b4-4012-a01f-ce6b5445c1aa"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("bdff881f-fdaa-4b1d-969c-ad0ac4756683"));

            migrationBuilder.AddColumn<decimal>(
                name: "CodCollectedAmount",
                table: "SHIPPER_PROFILE",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DebtLimit",
                table: "SHIPPER_PROFILE",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 5000000m);

            migrationBuilder.AddColumn<bool>(
                name: "IsFinancialSettled",
                table: "ORDER",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ItemsSubtotal",
                table: "ORDER",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "PaymentSessionId",
                table: "ORDER",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "ORDER",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformCommission",
                table: "ORDER",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SellerPayout",
                table: "ORDER",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "E_INVOICE_REQUEST",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaxCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CompanyAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_E_INVOICE_REQUEST", x => x.Id);
                    table.ForeignKey(
                        name: "FK_E_INVOICE_REQUEST_ORDER_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDER",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PAYMENT_SESSION",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UserAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PaymentMethod = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EWalletProvider = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CardLastFour = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    CardBrand = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PAYMENT_SESSION", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PLATFORM_FINANCE_CONFIG",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommissionRate = table.Column<decimal>(type: "decimal(5,4)", nullable: false, defaultValue: 0.10m),
                    DefaultShipperDebtLimit = table.Column<decimal>(type: "decimal(12,2)", nullable: false, defaultValue: 5000000m),
                    ShipperDeliveryBonus = table.Column<decimal>(type: "decimal(12,2)", nullable: false, defaultValue: 5000m),
                    MinWithdrawalAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false, defaultValue: 50000m),
                    LargeWithdrawalThreshold = table.Column<decimal>(type: "decimal(12,2)", nullable: false, defaultValue: 5000000m),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PLATFORM_FINANCE_CONFIG", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WALLET",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OwnerType = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(12,2)", nullable: false, defaultValue: 0m),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BankAccountNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    BankAccountHolder = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WALLET", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FINANCIAL_TRANSACTION",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReferenceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FINANCIAL_TRANSACTION", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FINANCIAL_TRANSACTION_WALLET_WalletId",
                        column: x => x.WalletId,
                        principalTable: "WALLET",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WITHDRAWAL_REQUEST",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BankAccountNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    BankAccountHolder = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RejectReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WITHDRAWAL_REQUEST", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WITHDRAWAL_REQUEST_WALLET_WalletId",
                        column: x => x.WalletId,
                        principalTable: "WALLET",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("0b22ea39-cc1d-4141-82f3-bfd3881c0267"), new DateTime(2026, 7, 6, 4, 26, 18, 311, DateTimeKind.Utc).AddTicks(2001), 100, "Silver" },
                    { new Guid("68876806-6642-472a-aa91-562e40ac08f1"), new DateTime(2026, 7, 6, 4, 26, 18, 311, DateTimeKind.Utc).AddTicks(2006), 1000, "Diamond" },
                    { new Guid("d0d24f71-3b51-437b-a42d-ad5bbc900e80"), new DateTime(2026, 7, 6, 4, 26, 18, 311, DateTimeKind.Utc).AddTicks(2004), 500, "Gold" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_E_INVOICE_REQUEST_OrderId",
                table: "E_INVOICE_REQUEST",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_FINANCIAL_TRANSACTION_WalletId",
                table: "FINANCIAL_TRANSACTION",
                column: "WalletId");

            migrationBuilder.CreateIndex(
                name: "IX_WALLET_OwnerType_OwnerId",
                table: "WALLET",
                columns: new[] { "OwnerType", "OwnerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WITHDRAWAL_REQUEST_WalletId",
                table: "WITHDRAWAL_REQUEST",
                column: "WalletId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "E_INVOICE_REQUEST");

            migrationBuilder.DropTable(
                name: "FINANCIAL_TRANSACTION");

            migrationBuilder.DropTable(
                name: "PAYMENT_SESSION");

            migrationBuilder.DropTable(
                name: "PLATFORM_FINANCE_CONFIG");

            migrationBuilder.DropTable(
                name: "WITHDRAWAL_REQUEST");

            migrationBuilder.DropTable(
                name: "WALLET");

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

            migrationBuilder.DropColumn(
                name: "CodCollectedAmount",
                table: "SHIPPER_PROFILE");

            migrationBuilder.DropColumn(
                name: "DebtLimit",
                table: "SHIPPER_PROFILE");

            migrationBuilder.DropColumn(
                name: "IsFinancialSettled",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "ItemsSubtotal",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "PaymentSessionId",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "PlatformCommission",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "SellerPayout",
                table: "ORDER");

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("4aa79c2e-9085-4823-9909-55de5d4a6f83"), new DateTime(2026, 7, 5, 14, 28, 38, 388, DateTimeKind.Utc).AddTicks(731), 500, "Gold" },
                    { new Guid("56343ff0-e9b4-4012-a01f-ce6b5445c1aa"), new DateTime(2026, 7, 5, 14, 28, 38, 388, DateTimeKind.Utc).AddTicks(729), 100, "Silver" },
                    { new Guid("bdff881f-fdaa-4b1d-969c-ad0ac4756683"), new DateTime(2026, 7, 5, 14, 28, 38, 388, DateTimeKind.Utc).AddTicks(733), 1000, "Diamond" }
                });
        }
    }
}
