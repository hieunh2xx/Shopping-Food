using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedToProductTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("0f3952d1-a910-4bfe-8477-1aa842a0505c"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("a1a9481b-f497-43a1-92e4-0cfa3f82f288"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("c9b945be-374a-499c-a812-58419d71bb50"));

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PRODUCT",
                type: "bit",
                nullable: false,
                defaultValue: false);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PRODUCT");

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("0f3952d1-a910-4bfe-8477-1aa842a0505c"), new DateTime(2026, 7, 4, 4, 36, 28, 596, DateTimeKind.Utc).AddTicks(1726), 500, "Gold" },
                    { new Guid("a1a9481b-f497-43a1-92e4-0cfa3f82f288"), new DateTime(2026, 7, 4, 4, 36, 28, 596, DateTimeKind.Utc).AddTicks(1727), 1000, "Diamond" },
                    { new Guid("c9b945be-374a-499c-a812-58419d71bb50"), new DateTime(2026, 7, 4, 4, 36, 28, 596, DateTimeKind.Utc).AddTicks(1724), 100, "Silver" }
                });
        }
    }
}
