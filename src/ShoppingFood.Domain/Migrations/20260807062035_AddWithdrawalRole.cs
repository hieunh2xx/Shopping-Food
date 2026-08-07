using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddWithdrawalRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "WITHDRAWAL_REQUEST",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransferProofImageUrl",
                table: "WITHDRAWAL_REQUEST",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "WITHDRAWAL_REQUEST");

            migrationBuilder.DropColumn(
                name: "TransferProofImageUrl",
                table: "WITHDRAWAL_REQUEST");
        }
    }
}
