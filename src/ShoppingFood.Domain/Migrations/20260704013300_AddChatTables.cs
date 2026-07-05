using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShoppingFood.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddChatTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("0eada80e-25e2-4380-a667-07993d8deb2d"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("809c9d0e-788e-4c8a-8440-65e090ded7c2"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("ad9d72e0-5959-453f-ae82-1ca584cfb830"));

            migrationBuilder.CreateTable(
                name: "CHAT_SESSION",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupportId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Topic = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHAT_SESSION", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CHAT_SESSION_USER_ACCOUNT_SupportId",
                        column: x => x.SupportId,
                        principalTable: "USER_ACCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CHAT_SESSION_USER_ACCOUNT_UserId",
                        column: x => x.UserId,
                        principalTable: "USER_ACCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CHAT_MESSAGE",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderRole = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHAT_MESSAGE", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CHAT_MESSAGE_CHAT_SESSION_SessionId",
                        column: x => x.SessionId,
                        principalTable: "CHAT_SESSION",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CHAT_MESSAGE_USER_ACCOUNT_SenderId",
                        column: x => x.SenderId,
                        principalTable: "USER_ACCOUNT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("966550dd-d1d6-44bf-a7dc-96b6ec31052e"), new DateTime(2026, 7, 4, 1, 32, 59, 227, DateTimeKind.Utc).AddTicks(4615), 100, "Silver" },
                    { new Guid("a903863b-f0cc-4d98-8a6a-046b68dc5c66"), new DateTime(2026, 7, 4, 1, 32, 59, 227, DateTimeKind.Utc).AddTicks(4618), 1000, "Diamond" },
                    { new Guid("d00a3136-c1fd-425c-ab6b-301c6f26c58f"), new DateTime(2026, 7, 4, 1, 32, 59, 227, DateTimeKind.Utc).AddTicks(4617), 500, "Gold" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CHAT_MESSAGE_SenderId",
                table: "CHAT_MESSAGE",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_CHAT_MESSAGE_SessionId",
                table: "CHAT_MESSAGE",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_CHAT_SESSION_SupportId",
                table: "CHAT_SESSION",
                column: "SupportId");

            migrationBuilder.CreateIndex(
                name: "IX_CHAT_SESSION_UserId",
                table: "CHAT_SESSION",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CHAT_MESSAGE");

            migrationBuilder.DropTable(
                name: "CHAT_SESSION");

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("966550dd-d1d6-44bf-a7dc-96b6ec31052e"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("a903863b-f0cc-4d98-8a6a-046b68dc5c66"));

            migrationBuilder.DeleteData(
                table: "MEMBER_TIER_CONFIG",
                keyColumn: "Id",
                keyValue: new Guid("d00a3136-c1fd-425c-ab6b-301c6f26c58f"));

            migrationBuilder.InsertData(
                table: "MEMBER_TIER_CONFIG",
                columns: new[] { "Id", "CreatedAt", "MinPoints", "Tier" },
                values: new object[,]
                {
                    { new Guid("0eada80e-25e2-4380-a667-07993d8deb2d"), new DateTime(2026, 7, 2, 3, 39, 14, 981, DateTimeKind.Utc).AddTicks(2697), 100, "Silver" },
                    { new Guid("809c9d0e-788e-4c8a-8440-65e090ded7c2"), new DateTime(2026, 7, 2, 3, 39, 14, 981, DateTimeKind.Utc).AddTicks(2699), 500, "Gold" },
                    { new Guid("ad9d72e0-5959-453f-ae82-1ca584cfb830"), new DateTime(2026, 7, 2, 3, 39, 14, 981, DateTimeKind.Utc).AddTicks(2700), 1000, "Diamond" }
                });
        }
    }
}
