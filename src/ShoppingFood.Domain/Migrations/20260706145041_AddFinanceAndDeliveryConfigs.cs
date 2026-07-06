using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceAndDeliveryConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.RenameColumn(
                name: "ShipperDeliveryBonus",
                table: "PLATFORM_FINANCE_CONFIG",
                newName: "ShipperRushHourBonus");

            migrationBuilder.AddColumn<decimal>(
                name: "CustomCommissionRate",
                table: "RESTAURANT_PROFILE",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BaseDeliveryFee",
                table: "PLATFORM_FINANCE_CONFIG",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 15000m);

            migrationBuilder.AddColumn<decimal>(
                name: "FeePerKm",
                table: "PLATFORM_FINANCE_CONFIG",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 5000m);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "RushHourEndTime",
                table: "PLATFORM_FINANCE_CONFIG",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<decimal>(
                name: "RushHourMultiplier",
                table: "PLATFORM_FINANCE_CONFIG",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 1.2m);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "RushHourStartTime",
                table: "PLATFORM_FINANCE_CONFIG",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<decimal>(
                name: "ShipperBaseFee",
                table: "PLATFORM_FINANCE_CONFIG",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 12000m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShipperFeePerKm",
                table: "PLATFORM_FINANCE_CONFIG",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 4000m);

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("77a034bc-785b-4ebb-bfb5-8134133f0f49"), new DateTime(2026, 7, 6, 14, 50, 38, 283, DateTimeKind.Utc).AddTicks(4215), 1000, "Diamond" },
                    { new Guid("af937f1a-69ad-4451-bbd9-2b99527cbb98"), new DateTime(2026, 7, 6, 14, 50, 38, 283, DateTimeKind.Utc).AddTicks(4211), 100, "Silver" },
                    { new Guid("e7da564b-c7e7-45af-8ca8-c8ce5d6005d8"), new DateTime(2026, 7, 6, 14, 50, 38, 283, DateTimeKind.Utc).AddTicks(4213), 500, "Gold" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("77a034bc-785b-4ebb-bfb5-8134133f0f49"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("af937f1a-69ad-4451-bbd9-2b99527cbb98"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("e7da564b-c7e7-45af-8ca8-c8ce5d6005d8"));

            migrationBuilder.DropColumn(
                name: "CustomCommissionRate",
                table: "RESTAURANT_PROFILE");

            migrationBuilder.DropColumn(
                name: "BaseDeliveryFee",
                table: "PLATFORM_FINANCE_CONFIG");

            migrationBuilder.DropColumn(
                name: "FeePerKm",
                table: "PLATFORM_FINANCE_CONFIG");

            migrationBuilder.DropColumn(
                name: "RushHourEndTime",
                table: "PLATFORM_FINANCE_CONFIG");

            migrationBuilder.DropColumn(
                name: "RushHourMultiplier",
                table: "PLATFORM_FINANCE_CONFIG");

            migrationBuilder.DropColumn(
                name: "RushHourStartTime",
                table: "PLATFORM_FINANCE_CONFIG");

            migrationBuilder.DropColumn(
                name: "ShipperBaseFee",
                table: "PLATFORM_FINANCE_CONFIG");

            migrationBuilder.DropColumn(
                name: "ShipperFeePerKm",
                table: "PLATFORM_FINANCE_CONFIG");

            migrationBuilder.RenameColumn(
                name: "ShipperRushHourBonus",
                table: "PLATFORM_FINANCE_CONFIG",
                newName: "ShipperDeliveryBonus");

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
    }
}
