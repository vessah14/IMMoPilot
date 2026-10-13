using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmoPilot.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class PaiementLoyerEnLigne : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateDemande",
                table: "Paiements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EnLigne",
                table: "Paiements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "JetonPaiement",
                table: "Locataires",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Locataires_JetonPaiement",
                table: "Locataires",
                column: "JetonPaiement",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Locataires_JetonPaiement",
                table: "Locataires");

            migrationBuilder.DropColumn(
                name: "DateDemande",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "EnLigne",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "JetonPaiement",
                table: "Locataires");
        }
    }
}
