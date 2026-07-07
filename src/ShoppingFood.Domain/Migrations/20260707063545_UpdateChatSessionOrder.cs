using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class UpdateChatSessionOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("2e4463c3-6cf5-4b14-bfb9-c3b9846a919a"), new DateTime(2026, 7, 7, 6, 35, 42, 859, DateTimeKind.Utc).AddTicks(1502), 500, "Gold" },
                    { new Guid("ab50cc6c-959b-49a6-b9e2-ce27e4c509dc"), new DateTime(2026, 7, 7, 6, 35, 42, 859, DateTimeKind.Utc).AddTicks(1501), 100, "Silver" },
                    { new Guid("c8187eb6-7b5e-4998-948b-4b08b49a049d"), new DateTime(2026, 7, 7, 6, 35, 42, 859, DateTimeKind.Utc).AddTicks(1504), 1000, "Diamond" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("2e4463c3-6cf5-4b14-bfb9-c3b9846a919a"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("ab50cc6c-959b-49a6-b9e2-ce27e4c509dc"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("c8187eb6-7b5e-4998-948b-4b08b49a049d"));

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
    }
}
