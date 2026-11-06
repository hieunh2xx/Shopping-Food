using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddCampusAndGroupOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach (var sql in GroupOrderSchemaSql.CreateStatements)
                migrationBuilder.Sql(sql);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("IF OBJECT_ID(N'dbo.GROUP_ORDER_ITEM', N'U') IS NOT NULL DROP TABLE dbo.GROUP_ORDER_ITEM;");
            migrationBuilder.Sql("IF OBJECT_ID(N'dbo.GROUP_ORDER_MEMBER', N'U') IS NOT NULL DROP TABLE dbo.GROUP_ORDER_MEMBER;");
            migrationBuilder.Sql("IF OBJECT_ID(N'dbo.GROUP_ORDER', N'U') IS NOT NULL DROP TABLE dbo.GROUP_ORDER;");
            migrationBuilder.Sql("IF OBJECT_ID(N'dbo.CAMPUS_BUILDING', N'U') IS NOT NULL DROP TABLE dbo.CAMPUS_BUILDING;");
            migrationBuilder.Sql("IF OBJECT_ID(N'dbo.CAMPUS', N'U') IS NOT NULL DROP TABLE dbo.CAMPUS;");
        }
    }
}
