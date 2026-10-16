using ImmoPilot.Api.Interfaces;

namespace ImmoPilot.Api.Services;

// Tâche de fond : toutes les 2 minutes, vérifie les paiements d'abonnement et de loyer restés en attente
// (utile quand le webhook SasPay n'arrive pas, par exemple en local), envoie les rappels avant échéance
// et (re)fait les reversements des loyers aux propriétaires.
public class TacheAbonnements(IServiceScopeFactory scopes, ILogger<TacheAbonnements> journal) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken arret)
    {
        using var minuterie = new PeriodicTimer(TimeSpan.FromMinutes(2));
        do
        {
            // Chaque partie a sa propre portée : une panne des abonnements ne bloque pas les reversements, et inversement
            await ExecuterAsync<IAbonnementService>(s => s.TacheDeFondAsync(), "des abonnements");
            await ExecuterAsync<IPaiementLoyerService>(s => s.TacheDeFondAsync(), "des loyers");
        } while (await minuterie.WaitForNextTickAsync(arret));
    }

    private async Task ExecuterAsync<TService>(Func<TService, Task> tache, string nom) where TService : notnull
    {
        try
        {
            using var scope = scopes.CreateScope();
            await tache(scope.ServiceProvider.GetRequiredService<TService>());
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            journal.LogWarning(ex, "Tâche de fond {Nom} en échec (nouvel essai dans 2 minutes)", nom);
        }
    }
}
