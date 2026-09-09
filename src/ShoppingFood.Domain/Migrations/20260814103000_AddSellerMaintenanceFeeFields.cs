using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ShoppingFood.Domain.Context;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    [DbContext(typeof(ShoppingFoodContext))]
    [Migration("20260814103000_AddSellerMaintenanceFeeFields")]
    public class AddSellerMaintenanceFeeFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.PLATFORM_FINANCE_CONFIG', 'SellerMaintenanceFee') IS NULL
                    ALTER TABLE dbo.PLATFORM_FINANCE_CONFIG ADD SellerMaintenanceFee decimal(12,2) NOT NULL
                        CONSTRAINT DF_PLATFORM_FINANCE_CONFIG_SellerMaintenanceFee DEFAULT(0);
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.RESTAURANT_PROFILE', 'LastMaintenanceFeeChargedAt') IS NULL
                    ALTER TABLE dbo.RESTAURANT_PROFILE ADD LastMaintenanceFeeChargedAt datetime2 NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.PLATFORM_FINANCE_CONFIG', 'SellerMaintenanceFee') IS NOT NULL
                BEGIN
                    DECLARE @df1 sysname;
                    SELECT @df1 = d.name FROM sys.default_constraints d
                    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
                    WHERE d.parent_object_id = OBJECT_ID('dbo.PLATFORM_FINANCE_CONFIG') AND c.name = 'SellerMaintenanceFee';
                    IF @df1 IS NOT NULL EXEC('ALTER TABLE dbo.PLATFORM_FINANCE_CONFIG DROP CONSTRAINT ' + @df1);
                    ALTER TABLE dbo.PLATFORM_FINANCE_CONFIG DROP COLUMN SellerMaintenanceFee;
                END
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.RESTAURANT_PROFILE', 'LastMaintenanceFeeChargedAt') IS NOT NULL
                    ALTER TABLE dbo.RESTAURANT_PROFILE DROP COLUMN LastMaintenanceFeeChargedAt;
                """);
        }
    }
}
