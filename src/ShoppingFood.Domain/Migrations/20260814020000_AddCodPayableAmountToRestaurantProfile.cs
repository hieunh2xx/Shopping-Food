using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ShoppingFood.Domain.Context;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    [DbContext(typeof(ShoppingFoodContext))]
    [Migration("20260814020000_AddCodPayableAmountToRestaurantProfile")]
    public class AddCodPayableAmountToRestaurantProfile : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.RESTAURANT_PROFILE', 'CodPayableAmount') IS NULL
                    ALTER TABLE dbo.RESTAURANT_PROFILE
                    ADD CodPayableAmount decimal(18,2) NOT NULL
                    CONSTRAINT DF_RESTAURANT_PROFILE_CodPayableAmount DEFAULT(0);
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.RESTAURANT_PROFILE', 'CodPayableAmount') IS NOT NULL
                BEGIN
                    DECLARE @df sysname;
                    SELECT @df = d.name
                    FROM sys.default_constraints d
                    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
                    WHERE d.parent_object_id = OBJECT_ID('dbo.RESTAURANT_PROFILE') AND c.name = 'CodPayableAmount';
                    IF @df IS NOT NULL EXEC(N'ALTER TABLE dbo.RESTAURANT_PROFILE DROP CONSTRAINT [' + @df + ']');
                    ALTER TABLE dbo.RESTAURANT_PROFILE DROP COLUMN CodPayableAmount;
                END
                """);
        }
    }
}
