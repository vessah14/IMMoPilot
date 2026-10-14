using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ImmoPilot.Api.Services;

public class ParametresService(ImmoPilotDbContext db, IMemoryCache cache) : IParametresService
{
    private const string CleCache = "parametres-plateforme";

    // Lus à chaque requête (mode maintenance) : gardés 30 secondes en mémoire
    public async Task<ParametresPlateforme> ObtenirAsync() =>
        (await cache.GetOrCreateAsync(CleCache, async entree =>
        {
            entree.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30);
            return await db.Parametres.AsNoTracking().OrderBy(x => x.Id).FirstOrDefaultAsync() ?? new ParametresPlateforme();
        }))!;

    public async Task<ParametresPlateformeDto> ObtenirDtoAsync() => VersDto(await ObtenirAsync());

    public async Task<ParametresPlateformeDto> ModifierAsync(ParametresPlateformeDto r)
    {
        var p = await db.Parametres.OrderBy(x => x.Id).FirstOrDefaultAsync();
        if (p is null)
        {
            p = new ParametresPlateforme();
            db.Parametres.Add(p);
        }

        p.NomPlateforme = r.NomPlateforme.Trim();
        p.EmailSupport = r.EmailSupport.Trim();
        p.TelephoneSupport = string.IsNullOrWhiteSpace(r.TelephoneSupport) ? null : r.TelephoneSupport.Trim();
        p.DureeEssaiJours = r.DureeEssaiJours;
        p.PrixStarter = r.PrixStarter;
        p.PrixPro = r.PrixPro;
        p.PrixEnterprise = r.PrixEnterprise;
        p.InscriptionsOuvertes = r.InscriptionsOuvertes;
        p.ModeMaintenance = r.ModeMaintenance;

        await db.SaveChangesAsync();
        cache.Remove(CleCache); // la modification s'applique tout de suite
        return VersDto(p);
    }

    public async Task<OffrePubliqueDto> OffreAsync()
    {
        var p = await ObtenirAsync();
        return new OffrePubliqueDto(
            p.InscriptionsOuvertes,
            p.DureeEssaiJours,
            Enum.GetValues<Formule>()
                .Select(f => new FormulePubliqueDto(f, p.Prix(f), LimitesFormule.Immeubles(f), LimitesFormule.Locataires(f)))
                .ToList());
    }

    private static ParametresPlateformeDto VersDto(ParametresPlateforme p) => new(
        p.NomPlateforme,
        p.EmailSupport,
        p.TelephoneSupport,
        p.DureeEssaiJours,
        p.PrixStarter,
        p.PrixPro,
        p.PrixEnterprise,
        p.InscriptionsOuvertes,
        p.ModeMaintenance);
}
