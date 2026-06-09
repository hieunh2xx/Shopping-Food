using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddCoordinatesToOrderAndAddressTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "USER_ADDRESS",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "USER_ADDRESS",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DeliveryLatitude",
                table: "ORDER",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DeliveryLongitude",
                table: "ORDER",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "USER_ADDRESS");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "USER_ADDRESS");

            migrationBuilder.DropColumn(
                name: "DeliveryLatitude",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "DeliveryLongitude",
                table: "ORDER");
        }
    }
}
