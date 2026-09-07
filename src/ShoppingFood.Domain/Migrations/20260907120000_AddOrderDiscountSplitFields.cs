using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    public partial class AddOrderDiscountSplitFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.[ORDER]', 'DiscountAmount') IS NULL
                    ALTER TABLE dbo.[ORDER] ADD DiscountAmount decimal(12,2) NOT NULL
                        CONSTRAINT DF_ORDER_DiscountAmount DEFAULT(0);
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.[ORDER]', 'TierDiscountAmount') IS NULL
                    ALTER TABLE dbo.[ORDER] ADD TierDiscountAmount decimal(12,2) NOT NULL
                        CONSTRAINT DF_ORDER_TierDiscountAmount DEFAULT(0);
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.[ORDER]', 'DiscountAmount') IS NOT NULL
                BEGIN
                    DECLARE @df1 sysname;
                    SELECT @df1 = d.name FROM sys.default_constraints d
                    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
                    WHERE d.parent_object_id = OBJECT_ID('dbo.[ORDER]') AND c.name = 'DiscountAmount';
                    IF @df1 IS NOT NULL EXEC('ALTER TABLE dbo.[ORDER] DROP CONSTRAINT ' + @df1);
                    ALTER TABLE dbo.[ORDER] DROP COLUMN DiscountAmount;
                END
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.[ORDER]', 'TierDiscountAmount') IS NOT NULL
                BEGIN
                    DECLARE @df2 sysname;
                    SELECT @df2 = d.name FROM sys.default_constraints d
                    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
                    WHERE d.parent_object_id = OBJECT_ID('dbo.[ORDER]') AND c.name = 'TierDiscountAmount';
                    IF @df2 IS NOT NULL EXEC('ALTER TABLE dbo.[ORDER] DROP CONSTRAINT ' + @df2);
                    ALTER TABLE dbo.[ORDER] DROP COLUMN TierDiscountAmount;
                END
                """);
        }
    }
}
