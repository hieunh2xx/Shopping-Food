using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddChatSessionOrderRestaurantFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OrderId",
                table: "CHAT_SESSION",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RestaurantId",
                table: "CHAT_SESSION",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "CHAT_SESSION");

            migrationBuilder.DropColumn(
                name: "RestaurantId",
                table: "CHAT_SESSION");
        }
    }
}
