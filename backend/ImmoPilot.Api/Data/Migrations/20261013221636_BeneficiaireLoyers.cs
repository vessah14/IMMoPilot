using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmoPilot.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class BeneficiaireLoyers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BeneficiaireCompte",
                table: "Logements",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BeneficiaireNom",
                table: "Logements",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BeneficiaireCompte",
                table: "Immeubles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BeneficiaireNom",
                table: "Immeubles",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BeneficiaireCompte",
                table: "Logements");

            migrationBuilder.DropColumn(
                name: "BeneficiaireNom",
                table: "Logements");

            migrationBuilder.DropColumn(
                name: "BeneficiaireCompte",
                table: "Immeubles");

            migrationBuilder.DropColumn(
                name: "BeneficiaireNom",
                table: "Immeubles");
        }
    }
}
