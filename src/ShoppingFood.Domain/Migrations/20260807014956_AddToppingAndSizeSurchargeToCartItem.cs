using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddToppingAndSizeSurchargeToCartItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ToppingAndSizeSurcharge",
                table: "CART_ITEM",
                type: "decimal(12,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ToppingAndSizeSurcharge",
                table: "CART_ITEM");
        }
    }
}
