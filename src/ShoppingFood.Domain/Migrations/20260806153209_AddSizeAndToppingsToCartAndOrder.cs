using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddSizeAndToppingsToCartAndOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SelectedSize",
                table: "ORDER_ITEM",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedToppings",
                table: "ORDER_ITEM",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedSize",
                table: "CART_ITEM",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedToppings",
                table: "CART_ITEM",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelectedSize",
                table: "ORDER_ITEM");

            migrationBuilder.DropColumn(
                name: "SelectedToppings",
                table: "ORDER_ITEM");

            migrationBuilder.DropColumn(
                name: "SelectedSize",
                table: "CART_ITEM");

            migrationBuilder.DropColumn(
                name: "SelectedToppings",
                table: "CART_ITEM");
        }
    }
}
