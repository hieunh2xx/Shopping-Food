using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperIncomeBreakdown : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ShipperBaseFeeAmount",
                table: "ORDER",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShipperDistanceFeeAmount",
                table: "ORDER",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShipperPeakBonus",
                table: "ORDER",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShipperBaseFeeAmount",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "ShipperDistanceFeeAmount",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "ShipperPeakBonus",
                table: "ORDER");
        }
    }
}
