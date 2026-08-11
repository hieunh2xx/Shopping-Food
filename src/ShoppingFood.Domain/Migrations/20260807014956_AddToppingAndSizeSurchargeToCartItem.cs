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
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.CART_ITEM', 'ToppingAndSizeSurcharge') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD ToppingAndSizeSurcharge decimal(12,2) NOT NULL CONSTRAINT DF_CART_ITEM_ToppingAndSizeSurcharge DEFAULT(0);
                """);
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
