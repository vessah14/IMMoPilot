using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmoPilot.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReferencePaiementSaspay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReferenceCampay",
                table: "PaiementsAbonnement",
                newName: "ReferencePaiement");

            migrationBuilder.RenameIndex(
                name: "IX_PaiementsAbonnement_ReferenceCampay",
                table: "PaiementsAbonnement",
                newName: "IX_PaiementsAbonnement_ReferencePaiement");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReferencePaiement",
                table: "PaiementsAbonnement",
                newName: "ReferenceCampay");

            migrationBuilder.RenameIndex(
                name: "IX_PaiementsAbonnement_ReferencePaiement",
                table: "PaiementsAbonnement",
                newName: "IX_PaiementsAbonnement_ReferenceCampay");
        }
    }
}
