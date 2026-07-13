using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddRestaurantDeliveryConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryType",
                table: "RESTAURANT_PROFILE",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "FreeDeliveryRadiusKm",
                table: "RESTAURANT_PROFILE",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "FreeShippingMinimumOrder",
                table: "RESTAURANT_PROFILE",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryType",
                table: "RESTAURANT_PROFILE");

            migrationBuilder.DropColumn(
                name: "FreeDeliveryRadiusKm",
                table: "RESTAURANT_PROFILE");

            migrationBuilder.DropColumn(
                name: "FreeShippingMinimumOrder",
                table: "RESTAURANT_PROFILE");
        }
    }
}
