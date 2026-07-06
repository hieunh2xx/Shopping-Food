using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperIncomeToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<decimal>(
                name: "ShipperIncome",
                table: "ORDER",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("027a86cc-2640-4825-94ee-103168089e15"), new DateTime(2026, 7, 6, 14, 58, 31, 400, DateTimeKind.Utc).AddTicks(8156), 1000, "Diamond" },
                    { new Guid("2cb28fee-5298-41e1-80d4-61cad1f48580"), new DateTime(2026, 7, 6, 14, 58, 31, 400, DateTimeKind.Utc).AddTicks(8154), 500, "Gold" },
                    { new Guid("4a78632a-b501-4848-b56d-da40f280d6ed"), new DateTime(2026, 7, 6, 14, 58, 31, 400, DateTimeKind.Utc).AddTicks(8153), 100, "Silver" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("027a86cc-2640-4825-94ee-103168089e15"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("2cb28fee-5298-41e1-80d4-61cad1f48580"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("4a78632a-b501-4848-b56d-da40f280d6ed"));

            migrationBuilder.DropColumn(
                name: "ShipperIncome",
                table: "ORDER");

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
    }
}
