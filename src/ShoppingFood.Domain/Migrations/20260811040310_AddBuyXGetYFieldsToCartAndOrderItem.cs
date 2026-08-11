using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddBuyXGetYFieldsToCartAndOrderItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: SchemaGuard / partial applies may already have these columns.
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.ORDER_ITEM', 'BuyXGetYPromotionId') IS NULL
                    ALTER TABLE dbo.ORDER_ITEM ADD BuyXGetYPromotionId uniqueidentifier NULL;

                IF COL_LENGTH('dbo.ORDER_ITEM', 'IsGift') IS NULL
                    ALTER TABLE dbo.ORDER_ITEM ADD IsGift bit NOT NULL CONSTRAINT DF_ORDER_ITEM_IsGift DEFAULT(0);

                IF COL_LENGTH('dbo.CART_ITEM', 'BuyXGetYPromotionId') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD BuyXGetYPromotionId uniqueidentifier NULL;

                IF COL_LENGTH('dbo.CART_ITEM', 'IsGift') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD IsGift bit NOT NULL CONSTRAINT DF_CART_ITEM_IsGift DEFAULT(0);

                IF COL_LENGTH('dbo.CART_ITEM', 'ParentCartItemId') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD ParentCartItemId uniqueidentifier NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CART_ITEM_BuyXGetYPromotionId' AND object_id = OBJECT_ID('dbo.CART_ITEM'))
                    CREATE INDEX IX_CART_ITEM_BuyXGetYPromotionId ON dbo.CART_ITEM (BuyXGetYPromotionId);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CART_ITEM_ParentCartItemId' AND object_id = OBJECT_ID('dbo.CART_ITEM'))
                    CREATE INDEX IX_CART_ITEM_ParentCartItemId ON dbo.CART_ITEM (ParentCartItemId);

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CART_ITEM_BUY_X_GET_Y_PROMOTION_BuyXGetYPromotionId')
                    ALTER TABLE dbo.CART_ITEM ADD CONSTRAINT FK_CART_ITEM_BUY_X_GET_Y_PROMOTION_BuyXGetYPromotionId
                        FOREIGN KEY (BuyXGetYPromotionId) REFERENCES dbo.BUY_X_GET_Y_PROMOTION (Id) ON DELETE SET NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CART_ITEM_CART_ITEM_ParentCartItemId')
                    ALTER TABLE dbo.CART_ITEM ADD CONSTRAINT FK_CART_ITEM_CART_ITEM_ParentCartItemId
                        FOREIGN KEY (ParentCartItemId) REFERENCES dbo.CART_ITEM (Id);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CART_ITEM_BUY_X_GET_Y_PROMOTION_BuyXGetYPromotionId')
                    ALTER TABLE dbo.CART_ITEM DROP CONSTRAINT FK_CART_ITEM_BUY_X_GET_Y_PROMOTION_BuyXGetYPromotionId;

                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CART_ITEM_CART_ITEM_ParentCartItemId')
                    ALTER TABLE dbo.CART_ITEM DROP CONSTRAINT FK_CART_ITEM_CART_ITEM_ParentCartItemId;

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CART_ITEM_BuyXGetYPromotionId' AND object_id = OBJECT_ID('dbo.CART_ITEM'))
                    DROP INDEX IX_CART_ITEM_BuyXGetYPromotionId ON dbo.CART_ITEM;

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CART_ITEM_ParentCartItemId' AND object_id = OBJECT_ID('dbo.CART_ITEM'))
                    DROP INDEX IX_CART_ITEM_ParentCartItemId ON dbo.CART_ITEM;

                IF COL_LENGTH('dbo.ORDER_ITEM', 'BuyXGetYPromotionId') IS NOT NULL
                    ALTER TABLE dbo.ORDER_ITEM DROP COLUMN BuyXGetYPromotionId;

                IF COL_LENGTH('dbo.ORDER_ITEM', 'IsGift') IS NOT NULL
                    ALTER TABLE dbo.ORDER_ITEM DROP COLUMN IsGift;

                IF COL_LENGTH('dbo.CART_ITEM', 'BuyXGetYPromotionId') IS NOT NULL
                    ALTER TABLE dbo.CART_ITEM DROP COLUMN BuyXGetYPromotionId;

                IF COL_LENGTH('dbo.CART_ITEM', 'IsGift') IS NOT NULL
                    ALTER TABLE dbo.CART_ITEM DROP COLUMN IsGift;

                IF COL_LENGTH('dbo.CART_ITEM', 'ParentCartItemId') IS NOT NULL
                    ALTER TABLE dbo.CART_ITEM DROP COLUMN ParentCartItemId;
                """);
        }
    }
}
