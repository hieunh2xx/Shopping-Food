using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "PRODUCT");

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "PRODUCT",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "MENU_CATEGORY",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MENU_CATEGORY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MENU_CATEGORY_RESTAURANT_PROFILE_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "RESTAURANT_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_CategoryId",
                table: "PRODUCT",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MENU_CATEGORY_RestaurantId",
                table: "MENU_CATEGORY",
                column: "RestaurantId");

            migrationBuilder.AddForeignKey(
                name: "FK_PRODUCT_MENU_CATEGORY_CategoryId",
                table: "PRODUCT",
                column: "CategoryId",
                principalTable: "MENU_CATEGORY",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PRODUCT_MENU_CATEGORY_CategoryId",
                table: "PRODUCT");

            migrationBuilder.DropTable(
                name: "MENU_CATEGORY");

            migrationBuilder.DropIndex(
                name: "IX_PRODUCT_CategoryId",
                table: "PRODUCT");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "PRODUCT");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "PRODUCT",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }
    }
}
