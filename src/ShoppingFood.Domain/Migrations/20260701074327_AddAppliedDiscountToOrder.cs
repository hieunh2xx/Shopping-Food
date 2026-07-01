using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddAppliedDiscountToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("5c5e456f-8d72-4925-8b1d-d4c03047fd1d"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("a80abf90-3cbd-457d-b0a3-4d0fffec9ce7"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("aa415db9-7933-49fd-abc1-aa99afd5b352"));

            migrationBuilder.AddColumn<Guid>(
                name: "AppliedDiscountId",
                table: "ORDER",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("a23d8d45-59d3-4446-867c-660a7cd78327"), new DateTime(2026, 7, 1, 7, 43, 25, 603, DateTimeKind.Utc).AddTicks(7910), 1000, "Diamond" },
                    { new Guid("c1dffa50-6445-44a6-9e0a-539cf9a2e13f"), new DateTime(2026, 7, 1, 7, 43, 25, 603, DateTimeKind.Utc).AddTicks(7907), 100, "Silver" },
                    { new Guid("c462caf8-9e7a-46ca-8338-42db0da96bfb"), new DateTime(2026, 7, 1, 7, 43, 25, 603, DateTimeKind.Utc).AddTicks(7909), 500, "Gold" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ORDER_AppliedDiscountId",
                table: "ORDER",
                column: "AppliedDiscountId");

            migrationBuilder.AddForeignKey(
                name: "FK_ORDER_DISCOUNT_AppliedDiscountId",
                table: "ORDER",
                column: "AppliedDiscountId",
                principalTable: "DISCOUNT",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ORDER_DISCOUNT_AppliedDiscountId",
                table: "ORDER");

            migrationBuilder.DropIndex(
                name: "IX_ORDER_AppliedDiscountId",
                table: "ORDER");

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("a23d8d45-59d3-4446-867c-660a7cd78327"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("c1dffa50-6445-44a6-9e0a-539cf9a2e13f"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("c462caf8-9e7a-46ca-8338-42db0da96bfb"));

            migrationBuilder.DropColumn(
                name: "AppliedDiscountId",
                table: "ORDER");

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("5c5e456f-8d72-4925-8b1d-d4c03047fd1d"), new DateTime(2026, 6, 29, 10, 3, 26, 671, DateTimeKind.Utc).AddTicks(31), 1000, "Diamond" },
                    { new Guid("a80abf90-3cbd-457d-b0a3-4d0fffec9ce7"), new DateTime(2026, 6, 29, 10, 3, 26, 671, DateTimeKind.Utc).AddTicks(29), 500, "Gold" },
                    { new Guid("aa415db9-7933-49fd-abc1-aa99afd5b352"), new DateTime(2026, 6, 29, 10, 3, 26, 671, DateTimeKind.Utc).AddTicks(27), 100, "Silver" }
                });
        }
    }
}
