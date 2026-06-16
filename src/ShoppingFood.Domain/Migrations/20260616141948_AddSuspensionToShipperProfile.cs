using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddSuspensionToShipperProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SuspendedReason",
                table: "SHIPPER_PROFILE",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SuspendedUntil",
                table: "SHIPPER_PROFILE",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SuspendedReason",
                table: "SHIPPER_PROFILE");

            migrationBuilder.DropColumn(
                name: "SuspendedUntil",
                table: "SHIPPER_PROFILE");
        }
    }
}
