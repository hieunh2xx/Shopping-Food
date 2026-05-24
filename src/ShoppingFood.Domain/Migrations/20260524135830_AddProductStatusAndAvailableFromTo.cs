using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddProductStatusAndAvailableFromTo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "AvailableFrom",
                table: "PRODUCT",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "AvailableTo",
                table: "PRODUCT",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "PRODUCT",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvailableFrom",
                table: "PRODUCT");

            migrationBuilder.DropColumn(
                name: "AvailableTo",
                table: "PRODUCT");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "PRODUCT");
        }
    }
}
