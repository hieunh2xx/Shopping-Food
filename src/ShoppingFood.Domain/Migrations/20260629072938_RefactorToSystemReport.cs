using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class RefactorToSystemReport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PRODUCT_REPORT");

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("860a3d3f-895a-49cb-8d7c-d7c37cdbe94b"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("8fd40f75-290f-499d-af02-fecd2d1b28a4"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("e2546c1f-17c4-4911-8990-7b3b3a795edb"));

            migrationBuilder.CreateTable(
                name: "SYSTEM_REPORT",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReporterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TargetType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SYSTEM_REPORT", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SYSTEM_REPORT_USER_PROFILE_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "USER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("76832172-1b3f-421e-9857-a5202b3670cd"), new DateTime(2026, 6, 29, 7, 29, 36, 118, DateTimeKind.Utc).AddTicks(2155), 500, "Gold" },
                    { new Guid("822e1db9-b64c-40d0-b5ab-ceff0277cee7"), new DateTime(2026, 6, 29, 7, 29, 36, 118, DateTimeKind.Utc).AddTicks(2160), 1000, "Diamond" },
                    { new Guid("a53c9627-d883-4b55-b43c-cc8f18f2efa7"), new DateTime(2026, 6, 29, 7, 29, 36, 118, DateTimeKind.Utc).AddTicks(2153), 100, "Silver" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SYSTEM_REPORT_ReporterId",
                table: "SYSTEM_REPORT",
                column: "ReporterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SYSTEM_REPORT");

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("76832172-1b3f-421e-9857-a5202b3670cd"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("822e1db9-b64c-40d0-b5ab-ceff0277cee7"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("a53c9627-d883-4b55-b43c-cc8f18f2efa7"));

            migrationBuilder.CreateTable(
                name: "PRODUCT_REPORT",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReporterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PRODUCT_REPORT", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PRODUCT_REPORT_PRODUCT_ProductId",
                        column: x => x.ProductId,
                        principalTable: "PRODUCT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PRODUCT_REPORT_USER_PROFILE_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "USER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("860a3d3f-895a-49cb-8d7c-d7c37cdbe94b"), new DateTime(2026, 6, 25, 9, 31, 19, 863, DateTimeKind.Utc).AddTicks(7704), 500, "Gold" },
                    { new Guid("8fd40f75-290f-499d-af02-fecd2d1b28a4"), new DateTime(2026, 6, 25, 9, 31, 19, 863, DateTimeKind.Utc).AddTicks(7705), 1000, "Diamond" },
                    { new Guid("e2546c1f-17c4-4911-8990-7b3b3a795edb"), new DateTime(2026, 6, 25, 9, 31, 19, 863, DateTimeKind.Utc).AddTicks(7699), 100, "Silver" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_REPORT_ProductId",
                table: "PRODUCT_REPORT",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCT_REPORT_ReporterId",
                table: "PRODUCT_REPORT",
                column: "ReporterId");
        }
    }
}
