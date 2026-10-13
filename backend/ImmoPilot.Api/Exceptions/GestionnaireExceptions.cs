using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ImmoPilot.Api.Exceptions;

// Transforme les exceptions métier en réponses HTTP claires (format ProblemDetails)
public class GestionnaireExceptions(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext contexte, Exception exception, CancellationToken annulation)
    {
        var (statut, titre) = exception switch
        {
            RegleMetierException => (StatusCodes.Status409Conflict, "Opération impossible"),
            DonneesInvalidesException => (StatusCodes.Status400BadRequest, "Données invalides"),
            _ => (0, ""),
        };
        if (statut == 0) return false; // autres erreurs : gestion par défaut (500)

        contexte.Response.StatusCode = statut;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = contexte,
            Exception = exception,
            ProblemDetails = new ProblemDetails { Status = statut, Title = titre, Detail = exception.Message },
        });
    }
}
