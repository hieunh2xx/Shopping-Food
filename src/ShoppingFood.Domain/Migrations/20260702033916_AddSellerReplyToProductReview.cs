using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddSellerReplyToProductReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("3c608e81-7f84-44b0-9a4d-284227e293ee"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("d237993a-658a-4fa3-a02a-36f5e997264c"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("e55f92ea-96cf-4823-9c85-bff89dd992fb"));

            migrationBuilder.AddColumn<DateTime>(
                name: "SellerRepliedAt",
                table: "PRODUCT_REVIEW",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SellerReply",
                table: "PRODUCT_REVIEW",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("0eada80e-25e2-4380-a667-07993d8deb2d"), new DateTime(2026, 7, 2, 3, 39, 14, 981, DateTimeKind.Utc).AddTicks(2697), 100, "Silver" },
                    { new Guid("809c9d0e-788e-4c8a-8440-65e090ded7c2"), new DateTime(2026, 7, 2, 3, 39, 14, 981, DateTimeKind.Utc).AddTicks(2699), 500, "Gold" },
                    { new Guid("ad9d72e0-5959-453f-ae82-1ca584cfb830"), new DateTime(2026, 7, 2, 3, 39, 14, 981, DateTimeKind.Utc).AddTicks(2700), 1000, "Diamond" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("0eada80e-25e2-4380-a667-07993d8deb2d"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("809c9d0e-788e-4c8a-8440-65e090ded7c2"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("ad9d72e0-5959-453f-ae82-1ca584cfb830"));

            migrationBuilder.DropColumn(
                name: "SellerRepliedAt",
                table: "PRODUCT_REVIEW");

            migrationBuilder.DropColumn(
                name: "SellerReply",
                table: "PRODUCT_REVIEW");

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("3c608e81-7f84-44b0-9a4d-284227e293ee"), new DateTime(2026, 7, 2, 2, 31, 55, 225, DateTimeKind.Utc).AddTicks(1155), 1000, "Diamond" },
                    { new Guid("d237993a-658a-4fa3-a02a-36f5e997264c"), new DateTime(2026, 7, 2, 2, 31, 55, 225, DateTimeKind.Utc).AddTicks(1153), 500, "Gold" },
                    { new Guid("e55f92ea-96cf-4823-9c85-bff89dd992fb"), new DateTime(2026, 7, 2, 2, 31, 55, 225, DateTimeKind.Utc).AddTicks(1152), 100, "Silver" }
                });
        }
    }
}
