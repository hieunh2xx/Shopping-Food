using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class ChangeToppingsToManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_PRODUCT_TOPPING",
                table: "PRODUCT_TOPPING");

            migrationBuilder.DropIndex(
                name: "IX_PRODUCT_TOPPING_ProductId",
                table: "PRODUCT_TOPPING");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "PRODUCT_TOPPING");

            migrationBuilder.DropColumn(
                name: "IsAvailable",
                table: "PRODUCT_TOPPING");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "PRODUCT_TOPPING");

            migrationBuilder.DropColumn(
                name: "ToppingName",
                table: "PRODUCT_TOPPING");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "PRODUCT_TOPPING",
                newName: "ToppingId");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "PRODUCT_REPORT",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddPrimaryKey(
                name: "PK_PRODUCT_TOPPING",
                table: "PRODUCT_TOPPING",
                columns: new[] { "ProductId", "ToppingId" });

            migrationBuilder.CreateTable(
                name: "TOPPING",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ToppingName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TOPPING", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TOPPING_RESTAURANT_PROFILE_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "RESTAURANT_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_TOPPING_ToppingId",
                table: "PRODUCT_TOPPING",
                column: "ToppingId");

            migrationBuilder.CreateIndex(
                name: "IX_TOPPING_RestaurantId",
                table: "TOPPING",
                column: "RestaurantId");

            migrationBuilder.AddForeignKey(
                name: "FK_PRODUCT_TOPPING_TOPPING_ToppingId",
                table: "PRODUCT_TOPPING",
                column: "ToppingId",
                principalTable: "TOPPING",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PRODUCT_TOPPING_TOPPING_ToppingId",
                table: "PRODUCT_TOPPING");

            migrationBuilder.DropTable(
                name: "TOPPING");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PRODUCT_TOPPING",
                table: "PRODUCT_TOPPING");

            migrationBuilder.DropIndex(
                name: "IX_PRODUCT_TOPPING_ToppingId",
                table: "PRODUCT_TOPPING");

            migrationBuilder.RenameColumn(
                name: "ToppingId",
                table: "PRODUCT_TOPPING",
                newName: "Id");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "PRODUCT_TOPPING",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAvailable",
                table: "PRODUCT_TOPPING",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "PRODUCT_TOPPING",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ToppingName",
                table: "PRODUCT_TOPPING",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "PRODUCT_REPORT",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_PRODUCT_TOPPING",
                table: "PRODUCT_TOPPING",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_TOPPING_ProductId",
                table: "PRODUCT_TOPPING",
                column: "ProductId");
        }
    }
}
