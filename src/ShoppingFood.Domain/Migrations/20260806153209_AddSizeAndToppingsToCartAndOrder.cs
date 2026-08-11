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
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.ORDER_ITEM', 'SelectedSize') IS NULL
                    ALTER TABLE dbo.ORDER_ITEM ADD SelectedSize nvarchar(max) NULL;
                IF COL_LENGTH('dbo.ORDER_ITEM', 'SelectedToppings') IS NULL
                    ALTER TABLE dbo.ORDER_ITEM ADD SelectedToppings nvarchar(max) NULL;
                IF COL_LENGTH('dbo.CART_ITEM', 'SelectedSize') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD SelectedSize nvarchar(max) NULL;
                IF COL_LENGTH('dbo.CART_ITEM', 'SelectedToppings') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD SelectedToppings nvarchar(max) NULL;
                """);
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
