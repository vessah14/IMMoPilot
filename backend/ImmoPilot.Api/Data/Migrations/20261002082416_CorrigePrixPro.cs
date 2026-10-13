using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmoPilot.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CorrigePrixPro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Corrige uniquement l'ancienne valeur de test ; conserve un prix déjà réglé par l'admin.
            migrationBuilder.Sql("UPDATE \"Parametres\" SET \"PrixPro\" = 15000 WHERE \"Id\" = 1 AND \"PrixPro\" = 25");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Parametres\" SET \"PrixPro\" = 25 WHERE \"Id\" = 1 AND \"PrixPro\" = 15000");
        }
    }
}
