using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvancedSearchFilter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "RESTAURANT_PROFILE",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "RESTAURANT_PROFILE",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFreeship",
                table: "PRODUCT",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "PRODUCT_REVIEW",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PRODUCT_REVIEW", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PRODUCT_REVIEW_PRODUCT_ProductId",
                        column: x => x.ProductId,
                        principalTable: "PRODUCT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PRODUCT_REVIEW_USER_PROFILE_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "USER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_REVIEW_ProductId",
                table: "PRODUCT_REVIEW",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_REVIEW_UserProfileId",
                table: "PRODUCT_REVIEW",
                column: "UserProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PRODUCT_REVIEW");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "RESTAURANT_PROFILE");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "RESTAURANT_PROFILE");

            migrationBuilder.DropColumn(
                name: "IsFreeship",
                table: "PRODUCT");
        }
    }
}
