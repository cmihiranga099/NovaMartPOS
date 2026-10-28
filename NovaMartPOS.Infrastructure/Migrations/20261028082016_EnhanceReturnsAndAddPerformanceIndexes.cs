using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaMartPOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceReturnsAndAddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StockTransactions_ProductId",
                table: "StockTransactions");

            migrationBuilder.AddColumn<string>(
                name: "ApprovedBy",
                table: "Returns",
                type: "varchar(150)",
                maxLength: 150,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ProcessedByCashierId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "Returns",
                type: "varchar(250)",
                maxLength: 250,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_StockTransactions_ProductId_CreatedAt",
                table: "StockTransactions",
                columns: new[] { "ProductId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Sales_CreatedAt",
                table: "Sales",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_CreatedAt",
                table: "Returns",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_ProcessedByCashierId",
                table: "Returns",
                column: "ProcessedByCashierId");

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Users_ProcessedByCashierId",
                table: "Returns",
                column: "ProcessedByCashierId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Users_ProcessedByCashierId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_StockTransactions_ProductId_CreatedAt",
                table: "StockTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Sales_CreatedAt",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Returns_CreatedAt",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_ProcessedByCashierId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "ApprovedBy",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "ProcessedByCashierId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "Returns");

            migrationBuilder.CreateIndex(
                name: "IX_StockTransactions_ProductId",
                table: "StockTransactions",
                column: "ProductId");
        }
    }
}
