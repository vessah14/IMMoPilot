namespace ImmoPilot.Api.Models;

public class Notification
{
    public int Id { get; set; }
    public TypeNotification Type { get; set; }
    public required string Titre { get; set; }
    public required string Message { get; set; }
    public DateTime Date { get; set; }
    public bool Lue { get; set; }

    public int UtilisateurId { get; set; } // destinataire
    public Utilisateur Utilisateur { get; set; } = null!;
}
