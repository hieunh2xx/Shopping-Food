using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperScheduleAndArea : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "OperatingLatitude",
                table: "SHIPPER_PROFILE",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OperatingLongitude",
                table: "SHIPPER_PROFILE",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OperatingRadiusKm",
                table: "SHIPPER_PROFILE",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkingSchedule",
                table: "SHIPPER_PROFILE",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OperatingLatitude",
                table: "SHIPPER_PROFILE");

            migrationBuilder.DropColumn(
                name: "OperatingLongitude",
                table: "SHIPPER_PROFILE");

            migrationBuilder.DropColumn(
                name: "OperatingRadiusKm",
                table: "SHIPPER_PROFILE");

            migrationBuilder.DropColumn(
                name: "WorkingSchedule",
                table: "SHIPPER_PROFILE");
        }
    }
}
