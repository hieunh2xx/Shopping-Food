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
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.WITHDRAWAL_REQUEST', 'ApprovedAt') IS NULL
                    ALTER TABLE dbo.WITHDRAWAL_REQUEST ADD ApprovedAt datetime2 NULL;
                IF COL_LENGTH('dbo.WITHDRAWAL_REQUEST', 'TransferProofImageUrl') IS NULL
                    ALTER TABLE dbo.WITHDRAWAL_REQUEST ADD TransferProofImageUrl nvarchar(max) NULL;
                """);
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
