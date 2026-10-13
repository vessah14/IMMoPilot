using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmoPilot.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CompteEncaissement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompteEncaissement",
                table: "Utilisateurs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompteVersement",
                table: "Paiements",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompteEncaissement",
                table: "Utilisateurs");

            migrationBuilder.DropColumn(
                name: "CompteVersement",
                table: "Paiements");
        }
    }
}
