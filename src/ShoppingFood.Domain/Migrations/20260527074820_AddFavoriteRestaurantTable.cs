using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddFavoriteRestaurantTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FAVORITE_RESTAURANT",
                columns: table => new
                {
                    UserProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FAVORITE_RESTAURANT", x => new { x.UserProfileId, x.RestaurantId });
                    table.ForeignKey(
                        name: "FK_FAVORITE_RESTAURANT_RESTAURANT_PROFILE_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "RESTAURANT_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FAVORITE_RESTAURANT_USER_PROFILE_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "USER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FAVORITE_RESTAURANT_RestaurantId",
                table: "FAVORITE_RESTAURANT",
                column: "RestaurantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FAVORITE_RESTAURANT");
        }
    }
}
