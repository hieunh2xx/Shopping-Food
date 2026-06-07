using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperProfileTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SHIPPER_PROFILE",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShipperApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VehicleType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VehiclePlateNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsOnline = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "Active"),
                    Latitude = table.Column<double>(type: "float", nullable: true),
                    Longitude = table.Column<double>(type: "float", nullable: true),
                    WalletBalance = table.Column<decimal>(type: "decimal(12,2)", nullable: false, defaultValue: 0m),
                    ReputationScore = table.Column<double>(type: "float", nullable: false, defaultValue: 100.0),
                    Rating = table.Column<double>(type: "float", nullable: false, defaultValue: 5.0),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SHIPPER_PROFILE", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SHIPPER_PROFILE_SHIPPER_APPLICATION_ShipperApplicationId",
                        column: x => x.ShipperApplicationId,
                        principalTable: "SHIPPER_APPLICATION",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SHIPPER_PROFILE_USER_PROFILE_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "USER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SHIPPER_PROFILE_ShipperApplicationId",
                table: "SHIPPER_PROFILE",
                column: "ShipperApplicationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SHIPPER_PROFILE_UserProfileId",
                table: "SHIPPER_PROFILE",
                column: "UserProfileId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SHIPPER_PROFILE");
        }
    }
}
