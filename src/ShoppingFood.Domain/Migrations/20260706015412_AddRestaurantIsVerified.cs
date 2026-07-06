using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddRestaurantIsVerified : Migration
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

            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "RESTAURANT_PROFILE",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("5ad454f3-3766-4ff7-a4cf-750a204d31f6"), new DateTime(2026, 7, 6, 1, 54, 10, 753, DateTimeKind.Utc).AddTicks(8920), 1000, "Diamond" },
                    { new Guid("693ced57-8ab7-4806-8280-dea3d597e7ab"), new DateTime(2026, 7, 6, 1, 54, 10, 753, DateTimeKind.Utc).AddTicks(8919), 500, "Gold" },
                    { new Guid("95c89a76-bd91-421c-bd0e-3640440da4cc"), new DateTime(2026, 7, 6, 1, 54, 10, 753, DateTimeKind.Utc).AddTicks(8917), 100, "Silver" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("5ad454f3-3766-4ff7-a4cf-750a204d31f6"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("693ced57-8ab7-4806-8280-dea3d597e7ab"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("95c89a76-bd91-421c-bd0e-3640440da4cc"));

            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "RESTAURANT_PROFILE");

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
