using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ShoppingFood.Domain.Context;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <summary>
    /// Adds FoodSafetyCertificateUrl to SELLER_APPLICATION.
    /// (Previous migration only synced ORDER_EXPLANATION_REQUEST.)
    /// </summary>
    [DbContext(typeof(ShoppingFoodContext))]
    [Migration("20260811120000_AddFoodSafetyCertificateUrlColumn")]
    public class AddFoodSafetyCertificateUrlColumn : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.SELLER_APPLICATION', 'FoodSafetyCertificateUrl') IS NULL
                    ALTER TABLE dbo.SELLER_APPLICATION
                    ADD FoodSafetyCertificateUrl nvarchar(255) NOT NULL
                    CONSTRAINT DF_SELLER_APPLICATION_FoodSafetyCertificateUrl DEFAULT('');
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.SELLER_APPLICATION', 'FoodSafetyCertificateUrl') IS NOT NULL
                BEGIN
                    DECLARE @df sysname;
                    SELECT @df = d.name
                    FROM sys.default_constraints d
                    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
                    WHERE d.parent_object_id = OBJECT_ID('dbo.SELLER_APPLICATION') AND c.name = 'FoodSafetyCertificateUrl';
                    IF @df IS NOT NULL EXEC(N'ALTER TABLE dbo.SELLER_APPLICATION DROP CONSTRAINT [' + @df + ']');
                    ALTER TABLE dbo.SELLER_APPLICATION DROP COLUMN FoodSafetyCertificateUrl;
                END
                """);
        }
    }
}
