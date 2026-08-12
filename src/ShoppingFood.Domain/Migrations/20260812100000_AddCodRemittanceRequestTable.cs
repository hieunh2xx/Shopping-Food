using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ShoppingFood.Domain.Context;

#nullable disable

namespace ShoppingFood.Domain.Migrations
{
    [DbContext(typeof(ShoppingFoodContext))]
    [Migration("20260812100000_AddCodRemittanceRequestTable")]
    public class AddCodRemittanceRequestTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'dbo.COD_REMITTANCE_REQUEST', N'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[COD_REMITTANCE_REQUEST] (
                        [Id] uniqueidentifier NOT NULL,
                        [ShipperProfileId] uniqueidentifier NOT NULL,
                        [Amount] decimal(12,2) NOT NULL,
                        [Note] nvarchar(500) NULL,
                        [ProofImageUrl] nvarchar(500) NULL,
                        [Status] nvarchar(50) NOT NULL,
                        [ReviewedByUserId] uniqueidentifier NULL,
                        [RejectReason] nvarchar(500) NULL,
                        [ReviewedAt] datetime2 NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [UpdatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_COD_REMITTANCE_REQUEST] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_COD_REMITTANCE_REQUEST_SHIPPER_PROFILE_ShipperProfileId]
                            FOREIGN KEY ([ShipperProfileId]) REFERENCES [dbo].[SHIPPER_PROFILE] ([Id]) ON DELETE NO ACTION
                    );

                    CREATE INDEX [IX_COD_REMITTANCE_REQUEST_ShipperProfileId]
                        ON [dbo].[COD_REMITTANCE_REQUEST] ([ShipperProfileId]);

                    CREATE INDEX [IX_COD_REMITTANCE_REQUEST_Status]
                        ON [dbo].[COD_REMITTANCE_REQUEST] ([Status]);
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'dbo.COD_REMITTANCE_REQUEST', N'U') IS NOT NULL
                    DROP TABLE [dbo].[COD_REMITTANCE_REQUEST];
                """);
        }
    }
}
