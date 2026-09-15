using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ShoppingFood.Domain.Context;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <summary>
    /// Marks when shipper confirmed food pickup at restaurant (order may still be Shipping).
    /// </summary>
    [DbContext(typeof(ShoppingFoodContext))]
    [Migration("20260915160000_AddFoodPickedUpAtToOrder")]
    public class AddFoodPickedUpAtToOrder : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'dbo.[ORDER]') AND name = N'FoodPickedUpAt'
                )
                    ALTER TABLE dbo.[ORDER] ADD FoodPickedUpAt datetime2 NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'dbo.[ORDER]') AND name = N'FoodPickedUpAt'
                )
                    ALTER TABLE dbo.[ORDER] DROP COLUMN FoodPickedUpAt;
                """);
        }
    }
}
