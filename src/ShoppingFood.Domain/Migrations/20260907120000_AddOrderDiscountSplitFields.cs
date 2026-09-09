using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ShoppingFood.Domain.Context;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <summary>
    /// Splits voucher vs member-tier discount amounts on ORDER.
    /// </summary>
    [DbContext(typeof(ShoppingFoodContext))]
    [Migration("20260907120000_AddOrderDiscountSplitFields")]
    public class AddOrderDiscountSplitFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'dbo.[ORDER]') AND name = N'DiscountAmount'
                )
                    ALTER TABLE dbo.[ORDER] ADD DiscountAmount decimal(12,2) NOT NULL
                        CONSTRAINT DF_ORDER_DiscountAmount DEFAULT(0);
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'dbo.[ORDER]') AND name = N'TierDiscountAmount'
                )
                    ALTER TABLE dbo.[ORDER] ADD TierDiscountAmount decimal(12,2) NOT NULL
                        CONSTRAINT DF_ORDER_TierDiscountAmount DEFAULT(0);
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'dbo.[ORDER]') AND name = N'DiscountAmount'
                )
                BEGIN
                    DECLARE @df1 sysname;
                    SELECT @df1 = d.name FROM sys.default_constraints d
                    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
                    WHERE d.parent_object_id = OBJECT_ID(N'dbo.[ORDER]') AND c.name = N'DiscountAmount';
                    IF @df1 IS NOT NULL EXEC('ALTER TABLE dbo.[ORDER] DROP CONSTRAINT ' + @df1);
                    ALTER TABLE dbo.[ORDER] DROP COLUMN DiscountAmount;
                END
                """);

            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'dbo.[ORDER]') AND name = N'TierDiscountAmount'
                )
                BEGIN
                    DECLARE @df2 sysname;
                    SELECT @df2 = d.name FROM sys.default_constraints d
                    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
                    WHERE d.parent_object_id = OBJECT_ID(N'dbo.[ORDER]') AND c.name = N'TierDiscountAmount';
                    IF @df2 IS NOT NULL EXEC('ALTER TABLE dbo.[ORDER] DROP CONSTRAINT ' + @df2);
                    ALTER TABLE dbo.[ORDER] DROP COLUMN TierDiscountAmount;
                END
                """);
        }
    }
}
