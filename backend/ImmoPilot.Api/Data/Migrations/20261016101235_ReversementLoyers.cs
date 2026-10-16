using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmoPilot.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReversementLoyers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CleReversement",
                table: "Paiements",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateReversement",
                table: "Paiements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EchecsReversement",
                table: "Paiements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ErreurReversement",
                table: "Paiements",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MontantNet",
                table: "Paiements",
                type: "numeric(14,2)",
                precision: 14,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MontantReverse",
                table: "Paiements",
                type: "numeric(14,2)",
                precision: 14,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceReversement",
                table: "Paiements",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StatutReversement",
                table: "Paiements",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Paiements_Reference",
                table: "Paiements",
                column: "Reference");

            migrationBuilder.CreateIndex(
                name: "IX_Paiements_ReferenceReversement",
                table: "Paiements",
                column: "ReferenceReversement");

            migrationBuilder.CreateIndex(
                name: "IX_Paiements_StatutReversement",
                table: "Paiements",
                column: "StatutReversement");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Paiements_Reference",
                table: "Paiements");

            migrationBuilder.DropIndex(
                name: "IX_Paiements_ReferenceReversement",
                table: "Paiements");

            migrationBuilder.DropIndex(
                name: "IX_Paiements_StatutReversement",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "CleReversement",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "DateReversement",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "EchecsReversement",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "ErreurReversement",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "MontantNet",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "MontantReverse",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "ReferenceReversement",
                table: "Paiements");

            migrationBuilder.DropColumn(
                name: "StatutReversement",
                table: "Paiements");
        }
    }
}
