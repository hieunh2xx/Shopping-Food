using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddPromotionAndLoyaltyTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BUY_X_GET_Y_PROMOTION",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TriggerProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuyQuantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    GiftProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GiftQuantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BUY_X_GET_Y_PROMOTION", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BUY_X_GET_Y_PROMOTION_PRODUCT_GiftProductId",
                        column: x => x.GiftProductId,
                        principalTable: "PRODUCT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BUY_X_GET_Y_PROMOTION_PRODUCT_TriggerProductId",
                        column: x => x.TriggerProductId,
                        principalTable: "PRODUCT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BUY_X_GET_Y_PROMOTION_RESTAURANT_PROFILE_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "RESTAURANT_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DISCOUNT",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Value = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MaxDiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MinOrderAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UsedCount = table.Column<int>(type: "int", nullable: false),
                    MaxUsagePerUser = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DISCOUNT", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DISCOUNT_RESTAURANT_PROFILE_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "RESTAURANT_PROFILE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FLASH_SALE",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FLASH_SALE", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LOYALTY_POINT",
                columns: table => new
                {
                    UserAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PointsBalance = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    TotalEarnedPoints = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Tier = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LOYALTY_POINT", x => x.UserAccountId);
                    table.ForeignKey(
                        name: "FK_LOYALTY_POINT_USER_ACCOUNT_UserAccountId",
                        column: x => x.UserAccountId,
                        principalTable: "USER_ACCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LOYALTY_POINT_HISTORY",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LOYALTY_POINT_HISTORY", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LOYALTY_POINT_HISTORY_USER_ACCOUNT_UserAccountId",
                        column: x => x.UserAccountId,
                        principalTable: "USER_ACCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CUSTOMER_DISCOUNT",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DiscountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsageCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CUSTOMER_DISCOUNT", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CUSTOMER_DISCOUNT_DISCOUNT_DiscountId",
                        column: x => x.DiscountId,
                        principalTable: "DISCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CUSTOMER_DISCOUNT_USER_ACCOUNT_UserAccountId",
                        column: x => x.UserAccountId,
                        principalTable: "USER_ACCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "POINT_GIFT_CONFIG",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DiscountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PointRequired = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POINT_GIFT_CONFIG", x => x.Id);
                    table.ForeignKey(
                        name: "FK_POINT_GIFT_CONFIG_DISCOUNT_DiscountId",
                        column: x => x.DiscountId,
                        principalTable: "DISCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FLASH_SALE_PRODUCT",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FlashSaleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FlashSalePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    QuantityLimit = table.Column<int>(type: "int", nullable: false),
                    SoldQuantity = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RejectReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FLASH_SALE_PRODUCT", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FLASH_SALE_PRODUCT_FLASH_SALE_FlashSaleId",
                        column: x => x.FlashSaleId,
                        principalTable: "FLASH_SALE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FLASH_SALE_PRODUCT_PRODUCT_ProductId",
                        column: x => x.ProductId,
                        principalTable: "PRODUCT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BUY_X_GET_Y_PROMOTION_GiftProductId",
                table: "BUY_X_GET_Y_PROMOTION",
                column: "GiftProductId");

            migrationBuilder.CreateIndex(
                name: "IX_BUY_X_GET_Y_PROMOTION_RestaurantId",
                table: "BUY_X_GET_Y_PROMOTION",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_BUY_X_GET_Y_PROMOTION_TriggerProductId",
                table: "BUY_X_GET_Y_PROMOTION",
                column: "TriggerProductId");

            migrationBuilder.CreateIndex(
                name: "IX_CUSTOMER_DISCOUNT_DiscountId",
                table: "CUSTOMER_DISCOUNT",
                column: "DiscountId");

            migrationBuilder.CreateIndex(
                name: "IX_CUSTOMER_DISCOUNT_UserAccountId",
                table: "CUSTOMER_DISCOUNT",
                column: "UserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_DISCOUNT_RestaurantId",
                table: "DISCOUNT",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_FLASH_SALE_PRODUCT_FlashSaleId",
                table: "FLASH_SALE_PRODUCT",
                column: "FlashSaleId");

            migrationBuilder.CreateIndex(
                name: "IX_FLASH_SALE_PRODUCT_ProductId",
                table: "FLASH_SALE_PRODUCT",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_LOYALTY_POINT_HISTORY_UserAccountId",
                table: "LOYALTY_POINT_HISTORY",
                column: "UserAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_POINT_GIFT_CONFIG_DiscountId",
                table: "POINT_GIFT_CONFIG",
                column: "DiscountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BUY_X_GET_Y_PROMOTION");

            migrationBuilder.DropTable(
                name: "CUSTOMER_DISCOUNT");

            migrationBuilder.DropTable(
                name: "FLASH_SALE_PRODUCT");

            migrationBuilder.DropTable(
                name: "LOYALTY_POINT");

            migrationBuilder.DropTable(
                name: "LOYALTY_POINT_HISTORY");

            migrationBuilder.DropTable(
                name: "POINT_GIFT_CONFIG");

            migrationBuilder.DropTable(
                name: "FLASH_SALE");

            migrationBuilder.DropTable(
                name: "DISCOUNT");
        }
    }
}
