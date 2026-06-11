using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderDeliveryProposalTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ORDER_DELIVERY_PROPOSAL",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShipperId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiredAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ORDER_DELIVERY_PROPOSAL", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ORDER_DELIVERY_PROPOSAL_ORDER_OrderId",
                        column: x => x.OrderId,
                        principalTable: "ORDER",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ORDER_DELIVERY_PROPOSAL_SHIPPER_PROFILE_ShipperId",
                        column: x => x.ShipperId,
                        principalTable: "SHIPPER_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ORDER_DELIVERY_PROPOSAL_OrderId",
                table: "ORDER_DELIVERY_PROPOSAL",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_ORDER_DELIVERY_PROPOSAL_ShipperId",
                table: "ORDER_DELIVERY_PROPOSAL",
                column: "ShipperId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ORDER_DELIVERY_PROPOSAL");
        }
    }
}
