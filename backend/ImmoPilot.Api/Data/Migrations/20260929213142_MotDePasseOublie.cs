using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmoPilot.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class MotDePasseOublie : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExpirationReinitialisation",
                table: "Utilisateurs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JetonReinitialisationHash",
                table: "Utilisateurs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "MotDePasseModifieLe",
                table: "Utilisateurs",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpirationReinitialisation",
                table: "Utilisateurs");

            migrationBuilder.DropColumn(
                name: "JetonReinitialisationHash",
                table: "Utilisateurs");

            migrationBuilder.DropColumn(
                name: "MotDePasseModifieLe",
                table: "Utilisateurs");
        }
    }
}
