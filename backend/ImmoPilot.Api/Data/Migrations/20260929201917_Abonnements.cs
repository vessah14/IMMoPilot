using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ImmoPilot.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Abonnements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DernierRappelAbonnement",
                table: "Utilisateurs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FinAbonnement",
                table: "Utilisateurs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PaiementsAbonnement",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Formule = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DureeMois = table.Column<int>(type: "integer", nullable: false),
                    Montant = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Telephone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Statut = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReferenceExterne = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReferenceCampay = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Operateur = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ReferenceOperateur = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NumeroFacture = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Manuel = table.Column<bool>(type: "boolean", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateConfirmation = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UtilisateurId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaiementsAbonnement", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaiementsAbonnement_Utilisateurs_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaiementsAbonnement_NumeroFacture",
                table: "PaiementsAbonnement",
                column: "NumeroFacture",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaiementsAbonnement_ReferenceCampay",
                table: "PaiementsAbonnement",
                column: "ReferenceCampay");

            migrationBuilder.CreateIndex(
                name: "IX_PaiementsAbonnement_ReferenceExterne",
                table: "PaiementsAbonnement",
                column: "ReferenceExterne",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaiementsAbonnement_Statut_DateCreation",
                table: "PaiementsAbonnement",
                columns: new[] { "Statut", "DateCreation" });

            migrationBuilder.CreateIndex(
                name: "IX_PaiementsAbonnement_UtilisateurId",
                table: "PaiementsAbonnement",
                column: "UtilisateurId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaiementsAbonnement");

            migrationBuilder.DropColumn(
                name: "DernierRappelAbonnement",
                table: "Utilisateurs");

            migrationBuilder.DropColumn(
                name: "FinAbonnement",
                table: "Utilisateurs");
        }
    }
}
