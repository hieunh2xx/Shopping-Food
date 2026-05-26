using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddGlobalMenuCategoryEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GlobalCategoryId",
                table: "PRODUCT",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GlobalMenuCategoryId",
                table: "PRODUCT",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GLOBAL_MENU_CATEGORY",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsHidden = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GLOBAL_MENU_CATEGORY", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_GlobalCategoryId",
                table: "PRODUCT",
                column: "GlobalCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_GlobalMenuCategoryId",
                table: "PRODUCT",
                column: "GlobalMenuCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_PRODUCT_GLOBAL_MENU_CATEGORY_GlobalCategoryId",
                table: "PRODUCT",
                column: "GlobalCategoryId",
                principalTable: "GLOBAL_MENU_CATEGORY",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PRODUCT_GLOBAL_MENU_CATEGORY_GlobalMenuCategoryId",
                table: "PRODUCT",
                column: "GlobalMenuCategoryId",
                principalTable: "GLOBAL_MENU_CATEGORY",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PRODUCT_GLOBAL_MENU_CATEGORY_GlobalCategoryId",
                table: "PRODUCT");

            migrationBuilder.DropForeignKey(
                name: "FK_PRODUCT_GLOBAL_MENU_CATEGORY_GlobalMenuCategoryId",
                table: "PRODUCT");

            migrationBuilder.DropTable(
                name: "GLOBAL_MENU_CATEGORY");

            migrationBuilder.DropIndex(
                name: "IX_PRODUCT_GlobalCategoryId",
                table: "PRODUCT");

            migrationBuilder.DropIndex(
                name: "IX_PRODUCT_GlobalMenuCategoryId",
                table: "PRODUCT");

            migrationBuilder.DropColumn(
                name: "GlobalCategoryId",
                table: "PRODUCT");

            migrationBuilder.DropColumn(
                name: "GlobalMenuCategoryId",
                table: "PRODUCT");
        }
    }
}
