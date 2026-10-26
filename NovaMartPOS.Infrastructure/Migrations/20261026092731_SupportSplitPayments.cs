using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaMartPOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SupportSplitPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_SaleId",
                table: "Payments");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_SaleId",
                table: "Payments",
                column: "SaleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_SaleId",
                table: "Payments");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_SaleId",
                table: "Payments",
                column: "SaleId",
                unique: true);
        }
    }
}
