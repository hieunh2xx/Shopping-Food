using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperIdToOrderTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ShipperId",
                table: "ORDER",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ORDER_ShipperId",
                table: "ORDER",
                column: "ShipperId");

            migrationBuilder.AddForeignKey(
                name: "FK_ORDER_SHIPPER_PROFILE_ShipperId",
                table: "ORDER",
                column: "ShipperId",
                principalTable: "SHIPPER_PROFILE",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ORDER_SHIPPER_PROFILE_ShipperId",
                table: "ORDER");

            migrationBuilder.DropIndex(
                name: "IX_ORDER_ShipperId",
                table: "ORDER");

            migrationBuilder.DropColumn(
                name: "ShipperId",
                table: "ORDER");
        }
    }
}
