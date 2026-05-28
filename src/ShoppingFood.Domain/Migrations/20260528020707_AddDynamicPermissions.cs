using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "API_ENDPOINT",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Path = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_API_ENDPOINT", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ROLE_PERMISSION",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ApiEndpointId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ROLE_PERMISSION", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ROLE_PERMISSION_API_ENDPOINT_ApiEndpointId",
                        column: x => x.ApiEndpointId,
                        principalTable: "API_ENDPOINT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "USER_PERMISSION",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApiEndpointId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsGranted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USER_PERMISSION", x => x.Id);
                    table.ForeignKey(
                        name: "FK_USER_PERMISSION_API_ENDPOINT_ApiEndpointId",
                        column: x => x.ApiEndpointId,
                        principalTable: "API_ENDPOINT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_USER_PERMISSION_USER_ACCOUNT_UserAccountId",
                        column: x => x.UserAccountId,
                        principalTable: "USER_ACCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ROLE_PERMISSION_ApiEndpointId",
                table: "ROLE_PERMISSION",
                column: "ApiEndpointId");

            migrationBuilder.CreateIndex(
                name: "IX_ROLE_PERMISSION_Role_ApiEndpointId",
                table: "ROLE_PERMISSION",
                columns: new[] { "Role", "ApiEndpointId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_USER_PERMISSION_ApiEndpointId",
                table: "USER_PERMISSION",
                column: "ApiEndpointId");

            migrationBuilder.CreateIndex(
                name: "IX_USER_PERMISSION_UserAccountId_ApiEndpointId",
                table: "USER_PERMISSION",
                columns: new[] { "UserAccountId", "ApiEndpointId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ROLE_PERMISSION");

            migrationBuilder.DropTable(
                name: "USER_PERMISSION");

            migrationBuilder.DropTable(
                name: "API_ENDPOINT");
        }
    }
}
