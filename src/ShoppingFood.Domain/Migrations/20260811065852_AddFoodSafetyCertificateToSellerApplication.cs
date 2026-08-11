using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddFoodSafetyCertificateToSellerApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ORDER_EXPLANATION_REQUEST",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedByProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestMessage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShipperReply = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RepliedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ORDER_EXPLANATION_REQUEST", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ORDER_EXPLANATION_REQUEST_ORDER_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDER",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ORDER_EXPLANATION_REQUEST_USER_PROFILE_RequestedByProfileId",
                        column: x => x.RequestedByProfileId,
                        principalTable: "USER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ORDER_EXPLANATION_REQUEST_OrderId",
                table: "ORDER_EXPLANATION_REQUEST",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_ORDER_EXPLANATION_REQUEST_RequestedByProfileId",
                table: "ORDER_EXPLANATION_REQUEST",
                column: "RequestedByProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ORDER_EXPLANATION_REQUEST");
        }
    }
}
