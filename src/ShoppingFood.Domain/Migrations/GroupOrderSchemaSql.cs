namespace ShoppingFood.Domain.Migrations
{
    /// <summary>
    /// Idempotent DDL for campus / group-order tables. Shared by the EF migration and the startup schema guard
    /// so the tables exist even when local migration history has drifted.
    /// </summary>
    public static class GroupOrderSchemaSql
    {
        public static readonly string[] CreateStatements =
        {
            """
            IF OBJECT_ID(N'dbo.CAMPUS', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.CAMPUS (
                    Id uniqueidentifier NOT NULL CONSTRAINT PK_CAMPUS PRIMARY KEY,
                    Code nvarchar(30) NOT NULL,
                    Name nvarchar(200) NOT NULL,
                    ShortName nvarchar(50) NOT NULL,
                    Address nvarchar(300) NOT NULL,
                    Description nvarchar(1000) NULL,
                    Latitude float NULL,
                    Longitude float NULL,
                    MinGroupMembers int NOT NULL,
                    MaxGroupMembers int NOT NULL,
                    GroupBaseShippingFee decimal(12,2) NOT NULL,
                    LobbySurchargePerMember decimal(12,2) NOT NULL,
                    RoomSurchargePerMember decimal(12,2) NOT NULL,
                    SingleRoomDeliveryFee decimal(12,2) NOT NULL,
                    IsActive bit NOT NULL,
                    SortOrder int NOT NULL,
                    CreatedAt datetime2 NOT NULL,
                    UpdatedAt datetime2 NOT NULL
                );
                CREATE UNIQUE INDEX IX_CAMPUS_Code ON dbo.CAMPUS (Code);
            END
            """,
            """
            IF OBJECT_ID(N'dbo.CAMPUS_BUILDING', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.CAMPUS_BUILDING (
                    Id uniqueidentifier NOT NULL CONSTRAINT PK_CAMPUS_BUILDING PRIMARY KEY,
                    CampusId uniqueidentifier NOT NULL,
                    Code nvarchar(30) NOT NULL,
                    Name nvarchar(150) NOT NULL,
                    ShortName nvarchar(50) NOT NULL,
                    BuildingType nvarchar(20) NOT NULL,
                    Zone nvarchar(150) NULL,
                    Description nvarchar(500) NULL,
                    DropPoint nvarchar(200) NULL,
                    Floors int NOT NULL,
                    AllowRoomDelivery bit NOT NULL,
                    MapX float NOT NULL,
                    MapY float NOT NULL,
                    MapWidth float NOT NULL,
                    MapHeight float NOT NULL,
                    Latitude float NULL,
                    Longitude float NULL,
                    IsActive bit NOT NULL,
                    SortOrder int NOT NULL,
                    CreatedAt datetime2 NOT NULL,
                    UpdatedAt datetime2 NOT NULL,
                    CONSTRAINT FK_CAMPUS_BUILDING_CAMPUS_CampusId FOREIGN KEY (CampusId) REFERENCES dbo.CAMPUS (Id) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX IX_CAMPUS_BUILDING_CampusId_Code ON dbo.CAMPUS_BUILDING (CampusId, Code);
            END
            """,
            """
            IF OBJECT_ID(N'dbo.GROUP_ORDER', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.GROUP_ORDER (
                    Id uniqueidentifier NOT NULL CONSTRAINT PK_GROUP_ORDER PRIMARY KEY,
                    Code nvarchar(10) NOT NULL,
                    Title nvarchar(150) NOT NULL,
                    CampusId uniqueidentifier NOT NULL,
                    BuildingId uniqueidentifier NOT NULL,
                    RestaurantId uniqueidentifier NOT NULL,
                    HostUserId uniqueidentifier NOT NULL,
                    DeliveryMode nvarchar(20) NOT NULL,
                    PaymentMode nvarchar(20) NOT NULL,
                    Status nvarchar(20) NOT NULL,
                    MinMembers int NOT NULL,
                    MaxMembers int NOT NULL,
                    BaseShippingFee decimal(12,2) NOT NULL,
                    SurchargePerMember decimal(12,2) NOT NULL,
                    ShippingFeeTotal decimal(12,2) NOT NULL,
                    ShipperIncome decimal(12,2) NOT NULL,
                    ItemsSubtotal decimal(12,2) NOT NULL,
                    TotalAmount decimal(12,2) NOT NULL,
                    Note nvarchar(500) NULL,
                    CancelReason nvarchar(500) NULL,
                    OrderId uniqueidentifier NULL,
                    ExpiresAt datetime2 NOT NULL,
                    SubmittedAt datetime2 NULL,
                    CreatedAt datetime2 NOT NULL,
                    UpdatedAt datetime2 NOT NULL,
                    CONSTRAINT FK_GROUP_ORDER_CAMPUS_CampusId FOREIGN KEY (CampusId) REFERENCES dbo.CAMPUS (Id),
                    CONSTRAINT FK_GROUP_ORDER_CAMPUS_BUILDING_BuildingId FOREIGN KEY (BuildingId) REFERENCES dbo.CAMPUS_BUILDING (Id),
                    CONSTRAINT FK_GROUP_ORDER_RESTAURANT_PROFILE_RestaurantId FOREIGN KEY (RestaurantId) REFERENCES dbo.RESTAURANT_PROFILE (Id),
                    CONSTRAINT FK_GROUP_ORDER_USER_ACCOUNT_HostUserId FOREIGN KEY (HostUserId) REFERENCES dbo.USER_ACCOUNT (Id),
                    CONSTRAINT FK_GROUP_ORDER_ORDER_OrderId FOREIGN KEY (OrderId) REFERENCES dbo.[ORDER] (Id) ON DELETE SET NULL
                );
                CREATE UNIQUE INDEX IX_GROUP_ORDER_Code ON dbo.GROUP_ORDER (Code);
                CREATE INDEX IX_GROUP_ORDER_BuildingId_Status ON dbo.GROUP_ORDER (BuildingId, Status);
                CREATE INDEX IX_GROUP_ORDER_CampusId ON dbo.GROUP_ORDER (CampusId);
                CREATE INDEX IX_GROUP_ORDER_HostUserId ON dbo.GROUP_ORDER (HostUserId);
                CREATE INDEX IX_GROUP_ORDER_OrderId ON dbo.GROUP_ORDER (OrderId);
                CREATE INDEX IX_GROUP_ORDER_RestaurantId ON dbo.GROUP_ORDER (RestaurantId);
            END
            """,
            """
            IF OBJECT_ID(N'dbo.GROUP_ORDER_MEMBER', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.GROUP_ORDER_MEMBER (
                    Id uniqueidentifier NOT NULL CONSTRAINT PK_GROUP_ORDER_MEMBER PRIMARY KEY,
                    GroupOrderId uniqueidentifier NOT NULL,
                    UserAccountId uniqueidentifier NOT NULL,
                    DisplayName nvarchar(100) NOT NULL,
                    Phone nvarchar(15) NOT NULL,
                    RoomNumber nvarchar(30) NULL,
                    Note nvarchar(300) NULL,
                    IsHost bit NOT NULL,
                    ItemsSubtotal decimal(12,2) NOT NULL,
                    ShippingShare decimal(12,2) NOT NULL,
                    PaidAmount decimal(12,2) NOT NULL,
                    PaymentStatus nvarchar(20) NOT NULL,
                    PaidByUserId uniqueidentifier NULL,
                    PaidAt datetime2 NULL,
                    JoinedAt datetime2 NOT NULL,
                    CONSTRAINT FK_GROUP_ORDER_MEMBER_GROUP_ORDER_GroupOrderId FOREIGN KEY (GroupOrderId) REFERENCES dbo.GROUP_ORDER (Id) ON DELETE CASCADE,
                    CONSTRAINT FK_GROUP_ORDER_MEMBER_USER_ACCOUNT_UserAccountId FOREIGN KEY (UserAccountId) REFERENCES dbo.USER_ACCOUNT (Id)
                );
                CREATE UNIQUE INDEX IX_GROUP_ORDER_MEMBER_GroupOrderId_UserAccountId ON dbo.GROUP_ORDER_MEMBER (GroupOrderId, UserAccountId);
                CREATE INDEX IX_GROUP_ORDER_MEMBER_UserAccountId ON dbo.GROUP_ORDER_MEMBER (UserAccountId);
            END
            """,
            """
            IF OBJECT_ID(N'dbo.GROUP_ORDER_ITEM', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.GROUP_ORDER_ITEM (
                    Id uniqueidentifier NOT NULL CONSTRAINT PK_GROUP_ORDER_ITEM PRIMARY KEY,
                    GroupOrderMemberId uniqueidentifier NOT NULL,
                    ProductId uniqueidentifier NOT NULL,
                    ItemName nvarchar(150) NOT NULL,
                    ImageUrl nvarchar(500) NULL,
                    Quantity int NOT NULL,
                    UnitPrice decimal(12,2) NOT NULL,
                    SelectedSize nvarchar(100) NULL,
                    SelectedToppings nvarchar(500) NULL,
                    Note nvarchar(200) NULL,
                    CreatedAt datetime2 NOT NULL,
                    CONSTRAINT FK_GROUP_ORDER_ITEM_GROUP_ORDER_MEMBER_GroupOrderMemberId FOREIGN KEY (GroupOrderMemberId) REFERENCES dbo.GROUP_ORDER_MEMBER (Id) ON DELETE CASCADE,
                    CONSTRAINT FK_GROUP_ORDER_ITEM_PRODUCT_ProductId FOREIGN KEY (ProductId) REFERENCES dbo.PRODUCT (Id)
                );
                CREATE INDEX IX_GROUP_ORDER_ITEM_GroupOrderMemberId ON dbo.GROUP_ORDER_ITEM (GroupOrderMemberId);
                CREATE INDEX IX_GROUP_ORDER_ITEM_ProductId ON dbo.GROUP_ORDER_ITEM (ProductId);
            END
            """
        };

        public static readonly string[] MemberDeliveredAtStatements =
        {
            """
            IF COL_LENGTH('dbo.GROUP_ORDER_MEMBER', 'DeliveredAt') IS NULL
                ALTER TABLE dbo.GROUP_ORDER_MEMBER ADD DeliveredAt datetime2 NULL;
            """
        };
    }
}
