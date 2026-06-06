using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperApplicationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SHIPPER_APPLICATION",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IdentityCardNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IdentityCardFrontUrl = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IdentityCardBackUrl = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    VehicleType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VehiclePlateNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DriverLicenseUrl = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    VehicleRegistrationUrl = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReviewedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SHIPPER_APPLICATION", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SHIPPER_APPLICATION_USER_PROFILE_ReviewedBy",
                        column: x => x.ReviewedBy,
                        principalTable: "USER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SHIPPER_APPLICATION_USER_PROFILE_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "USER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SHIPPER_APPLICATION_ReviewedBy",
                table: "SHIPPER_APPLICATION",
                column: "ReviewedBy");

            migrationBuilder.CreateIndex(
                name: "IX_SHIPPER_APPLICATION_UserProfileId",
                table: "SHIPPER_APPLICATION",
                column: "UserProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SHIPPER_APPLICATION");
        }
    }
}
