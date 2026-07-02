using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperReviewTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ORDER_DISCOUNT_AppliedDiscountId",
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

            migrationBuilder.CreateTable(
                name: "SHIPPER_REVIEW",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShipperProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReviewerAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SHIPPER_REVIEW", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SHIPPER_REVIEW_ORDER_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDER",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SHIPPER_REVIEW_SHIPPER_PROFILE_ShipperProfileId",
                        column: x => x.ShipperProfileId,
                        principalTable: "SHIPPER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SHIPPER_REVIEW_USER_ACCOUNT_ReviewerAccountId",
                        column: x => x.ReviewerAccountId,
                        principalTable: "USER_ACCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("3c608e81-7f84-44b0-9a4d-284227e293ee"), new DateTime(2026, 7, 2, 2, 31, 55, 225, DateTimeKind.Utc).AddTicks(1155), 1000, "Diamond" },
                    { new Guid("d237993a-658a-4fa3-a02a-36f5e997264c"), new DateTime(2026, 7, 2, 2, 31, 55, 225, DateTimeKind.Utc).AddTicks(1153), 500, "Gold" },
                    { new Guid("e55f92ea-96cf-4823-9c85-bff89dd992fb"), new DateTime(2026, 7, 2, 2, 31, 55, 225, DateTimeKind.Utc).AddTicks(1152), 100, "Silver" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SHIPPER_REVIEW_OrderId",
                table: "SHIPPER_REVIEW",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SHIPPER_REVIEW_ReviewerAccountId",
                table: "SHIPPER_REVIEW",
                column: "ReviewerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_SHIPPER_REVIEW_ShipperProfileId",
                table: "SHIPPER_REVIEW",
                column: "ShipperProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_ORDER_DISCOUNT_AppliedDiscountId",
                table: "ORDER",
                column: "AppliedDiscountId",
                principalTable: "DISCOUNT",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ORDER_DISCOUNT_AppliedDiscountId",
                table: "ORDER");

            migrationBuilder.DropTable(
                name: "SHIPPER_REVIEW");

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

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("a23d8d45-59d3-4446-867c-660a7cd78327"), new DateTime(2026, 7, 1, 7, 43, 25, 603, DateTimeKind.Utc).AddTicks(7910), 1000, "Diamond" },
                    { new Guid("c1dffa50-6445-44a6-9e0a-539cf9a2e13f"), new DateTime(2026, 7, 1, 7, 43, 25, 603, DateTimeKind.Utc).AddTicks(7907), 100, "Silver" },
                    { new Guid("c462caf8-9e7a-46ca-8338-42db0da96bfb"), new DateTime(2026, 7, 1, 7, 43, 25, 603, DateTimeKind.Utc).AddTicks(7909), 500, "Gold" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_ORDER_DISCOUNT_AppliedDiscountId",
                table: "ORDER",
                column: "AppliedDiscountId",
                principalTable: "DISCOUNT",
                principalColumn: "Id");
        }
    }
}
