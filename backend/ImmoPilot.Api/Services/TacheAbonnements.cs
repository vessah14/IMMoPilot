using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Tâche de fond : toutes les 2 minutes, vérifie les paiements d'abonnement restés en attente
// (utile quand le webhook CamPay n'arrive pas, par exemple en local) et envoie les rappels avant échéance.
public class TacheAbonnements(IServiceScopeFactory scopes, ILogger<TacheAbonnements> journal) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken arret)
    {
        using var minuterie = new PeriodicTimer(TimeSpan.FromMinutes(2));
        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<IAbonnementService>().TacheDeFondAsync();
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                journal.LogWarning(ex, "Tâche de fond des abonnements en échec (nouvel essai dans 2 minutes)");
            }
        } while (await minuterie.WaitForNextTickAsync(arret));
    }
}
