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
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.CHAT_SESSION', 'OrderId') IS NULL
                    ALTER TABLE dbo.CHAT_SESSION ADD OrderId uniqueidentifier NULL;
                IF COL_LENGTH('dbo.CHAT_SESSION', 'RestaurantId') IS NULL
                    ALTER TABLE dbo.CHAT_SESSION ADD RestaurantId uniqueidentifier NULL;
                """);
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
