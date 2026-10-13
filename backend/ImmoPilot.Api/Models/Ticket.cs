namespace ImmoPilot.Api.Models;

// Demande d'aide envoyée par un bailleur à l'équipe IMMO PILOT
public class Ticket
{
    public int Id { get; set; }
    public required string Sujet { get; set; }
    public required string Message { get; set; }
    public PrioriteTicket Priorite { get; set; } = PrioriteTicket.Moyenne;
    public StatutTicket Statut { get; set; } = StatutTicket.Ouvert;
    public DateTime DateCreation { get; set; }
    public string? Reponse { get; set; }
    public DateTime? DateReponse { get; set; }

    public int UtilisateurId { get; set; }
    public Utilisateur Utilisateur { get; set; } = null!;
}
