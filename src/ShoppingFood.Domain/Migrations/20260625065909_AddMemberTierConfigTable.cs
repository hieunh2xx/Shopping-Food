using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberTierConfigTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MEMBER_TIER_CONFIG",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tier = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MinPoints = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MEMBER_TIER_CONFIG", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("098757a3-d3bf-416e-ab37-b400ea45e8e6"), new DateTime(2026, 6, 25, 6, 59, 7, 950, DateTimeKind.Utc).AddTicks(8683), 500, "Gold" },
                    { new Guid("cb4d8a92-0766-4722-9815-d7a654440a6e"), new DateTime(2026, 6, 25, 6, 59, 7, 950, DateTimeKind.Utc).AddTicks(8666), 100, "Silver" },
                    { new Guid("e01b3c48-2450-4acc-affb-e8e27a8b1569"), new DateTime(2026, 6, 25, 6, 59, 7, 950, DateTimeKind.Utc).AddTicks(8685), 1000, "Diamond" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MEMBER_TIER_CONFIG");
        }
    }
}
