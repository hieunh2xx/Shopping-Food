using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Context;

namespace ShoppingFood.API.Data
{
    /// <summary>
    /// Idempotent schema patches for local/dev when EF migration history drifts
    /// (columns already exist / migrations marked applied out of order).
    /// </summary>
    public static class DatabaseSchemaGuard
    {
        public static async Task EnsureCriticalColumnsAsync(ShoppingFoodContext context)
        {
            var statements = new[]
            {
                """
                IF COL_LENGTH('dbo.WITHDRAWAL_REQUEST', 'ApprovedAt') IS NULL
                    ALTER TABLE dbo.WITHDRAWAL_REQUEST ADD ApprovedAt datetime2 NULL;
                """,
                """
                IF COL_LENGTH('dbo.WITHDRAWAL_REQUEST', 'TransferProofImageUrl') IS NULL
                    ALTER TABLE dbo.WITHDRAWAL_REQUEST ADD TransferProofImageUrl nvarchar(max) NULL;
                """,
                """
                IF COL_LENGTH('dbo.ORDER_ITEM', 'SelectedSize') IS NULL
                    ALTER TABLE dbo.ORDER_ITEM ADD SelectedSize nvarchar(max) NULL;
                """,
                """
                IF COL_LENGTH('dbo.ORDER_ITEM', 'SelectedToppings') IS NULL
                    ALTER TABLE dbo.ORDER_ITEM ADD SelectedToppings nvarchar(max) NULL;
                """,
                """
                IF COL_LENGTH('dbo.CART_ITEM', 'SelectedSize') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD SelectedSize nvarchar(max) NULL;
                """,
                """
                IF COL_LENGTH('dbo.CART_ITEM', 'SelectedToppings') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD SelectedToppings nvarchar(max) NULL;
                """,
                """
                IF COL_LENGTH('dbo.CART_ITEM', 'ToppingAndSizeSurcharge') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD ToppingAndSizeSurcharge decimal(12,2) NOT NULL CONSTRAINT DF_CART_ITEM_ToppingAndSizeSurcharge DEFAULT(0);
                """,
                """
                IF COL_LENGTH('dbo.CART_ITEM', 'BuyXGetYPromotionId') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD BuyXGetYPromotionId uniqueidentifier NULL;
                """,
                """
                IF COL_LENGTH('dbo.CART_ITEM', 'IsGift') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD IsGift bit NOT NULL CONSTRAINT DF_CART_ITEM_IsGift DEFAULT(0);
                """,
                """
                IF COL_LENGTH('dbo.CART_ITEM', 'ParentCartItemId') IS NULL
                    ALTER TABLE dbo.CART_ITEM ADD ParentCartItemId uniqueidentifier NULL;
                """,
                """
                IF COL_LENGTH('dbo.ORDER_ITEM', 'IsGift') IS NULL
                    ALTER TABLE dbo.ORDER_ITEM ADD IsGift bit NOT NULL CONSTRAINT DF_ORDER_ITEM_IsGift DEFAULT(0);
                """,
                """
                IF COL_LENGTH('dbo.ORDER_ITEM', 'BuyXGetYPromotionId') IS NULL
                    ALTER TABLE dbo.ORDER_ITEM ADD BuyXGetYPromotionId uniqueidentifier NULL;
                """,
                """
                IF COL_LENGTH('dbo.CHAT_SESSION', 'OrderId') IS NULL
                    ALTER TABLE dbo.CHAT_SESSION ADD OrderId uniqueidentifier NULL;
                """,
                """
                IF COL_LENGTH('dbo.CHAT_SESSION', 'RestaurantId') IS NULL
                    ALTER TABLE dbo.CHAT_SESSION ADD RestaurantId uniqueidentifier NULL;
                """,
                """
                IF OBJECT_ID('dbo.ORDER_EXPLANATION_REQUEST', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.ORDER_EXPLANATION_REQUEST (
                        Id uniqueidentifier NOT NULL PRIMARY KEY,
                        OrderId uniqueidentifier NOT NULL,
                        RequestedByProfileId uniqueidentifier NOT NULL,
                        RequestMessage nvarchar(1000) NOT NULL,
                        Status nvarchar(50) NOT NULL,
                        ShipperReply nvarchar(2000) NULL,
                        CreatedAt datetime2 NOT NULL,
                        RepliedAt datetime2 NULL,
                        CONSTRAINT FK_ORDER_EXPLANATION_REQUEST_ORDER FOREIGN KEY (OrderId) REFERENCES dbo.[ORDER](Id) ON DELETE CASCADE,
                        CONSTRAINT FK_ORDER_EXPLANATION_REQUEST_PROFILE FOREIGN KEY (RequestedByProfileId) REFERENCES dbo.USER_PROFILE(Id)
                    );
                    CREATE INDEX IX_ORDER_EXPLANATION_REQUEST_OrderId ON dbo.ORDER_EXPLANATION_REQUEST (OrderId);
                END
                """,
            };

            foreach (var sql in statements)
            {
                await context.Database.ExecuteSqlRawAsync(sql);
            }

            Console.WriteLine("[DatabaseSchemaGuard] Critical columns verified.");
        }
    }
}
