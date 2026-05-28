using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddRestaurantConfigFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BannerUrl",
                table: "RESTAURANT_PROFILE",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "ClosingTime",
                table: "RESTAURANT_PROFILE",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MaxDeliveryRadiusKm",
                table: "RESTAURANT_PROFILE",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "OpeningTime",
                table: "RESTAURANT_PROFILE",
                type: "time",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BannerUrl",
                table: "RESTAURANT_PROFILE");

            migrationBuilder.DropColumn(
                name: "ClosingTime",
                table: "RESTAURANT_PROFILE");

            migrationBuilder.DropColumn(
                name: "MaxDeliveryRadiusKm",
                table: "RESTAURANT_PROFILE");

            migrationBuilder.DropColumn(
                name: "OpeningTime",
                table: "RESTAURANT_PROFILE");
        }
    }
}
