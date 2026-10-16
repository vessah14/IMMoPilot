using ImmoPilot.Api.Data;
using ImmoPilot.Api.Models;
using ImmoPilot.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Controllers;

// [ReserveA(Fonctionnalite.Rapports)] : action refusée (403) si la formule du bailleur connecté ne comprend pas
// cette fonction. Vérifié côté serveur à chaque appel, d'après la formule enregistrée en base (jamais d'après le navigateur).
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class ReserveAAttribute(Fonctionnalite fonction) : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext contexte, ActionExecutionDelegate suite)
    {
        var id = int.TryParse(contexte.HttpContext.User.FindFirst(JetonService.ClaimId)?.Value, out var v) ? v : 0;
        var db = contexte.HttpContext.RequestServices.GetRequiredService<ImmoPilotDbContext>();
        var formule = await db.Utilisateurs.Where(u => u.Id == id).Select(u => (Formule?)u.Formule).FirstOrDefaultAsync();

        if (formule is not { } f || !LimitesFormule.Autorise(f, fonction))
        {
            var minimale = LimitesFormule.FormuleMinimale(fonction);
            var probleme = new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Fonction non incluse dans votre formule",
                Detail = $"{Libelle(fonction)} : réservé à la formule {minimale}"
                         + (minimale == Formule.Pro ? " ou Enterprise" : "")
                         + ". Changez de formule dans Paramètres → Abonnement.",
            };
            probleme.Extensions["code"] = "formule_insuffisante";
            probleme.Extensions["formuleRequise"] = minimale.ToString();
            contexte.Result = new ObjectResult(probleme) { StatusCode = StatusCodes.Status403Forbidden };
            return;
        }
        await suite();
    }

    public static string Libelle(Fonctionnalite fonction) => fonction switch
    {
        Fonctionnalite.Relances => "Les relances par e-mail et WhatsApp",
        Fonctionnalite.Rapports => "Les rapports financiers",
        Fonctionnalite.ProprietairesMultiples => "Plusieurs propriétaires par parc",
        _ => "Le support depuis votre espace",
    };
}
