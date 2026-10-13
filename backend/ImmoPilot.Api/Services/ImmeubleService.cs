using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

// Toutes les requêtes sont limitées aux immeubles du bailleur connecté (moi.Id)
public class ImmeubleService(ImmoPilotDbContext db, IUtilisateurCourant moi, IStockagePhotos photos) : IImmeubleService
{
    private IQueryable<Immeuble> MesImmeubles => db.Immeubles.Where(i => i.ProprietaireId == moi.Id);

    public async Task<IReadOnlyList<ImmeubleDto>> ListerAsync(string? ville)
    {
        var requete = MesImmeubles.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(ville))
            requete = requete.Where(i => EF.Functions.ILike(i.Ville, ville.Trim()));

        return await VersDto(requete.OrderBy(i => i.Nom)).ToListAsync();
    }

    public Task<ImmeubleDto?> ObtenirAsync(int id) =>
        VersDto(MesImmeubles.AsNoTracking().Where(i => i.Id == id)).FirstOrDefaultAsync();

    public async Task<ImmeubleDto> CreerAsync(ImmeubleRequeteDto requete)
    {
        // La formule limite le nombre d'immeubles
        var formule = await db.Utilisateurs.Where(u => u.Id == moi.Id).Select(u => u.Formule).FirstAsync();
        var limite = LimitesFormule.Immeubles(formule);
        if (limite is not null && await MesImmeubles.CountAsync() >= limite)
            throw new RegleMetierException(
                $"Votre formule {formule} permet {limite} immeubles au maximum. Passez à une formule supérieure pour en ajouter.");

        var immeuble = new Immeuble
        {
            Nom = requete.Nom.Trim(),
            Adresse = requete.Adresse.Trim(),
            Ville = requete.Ville.Trim(),
            Quartier = requete.Quartier.Trim(),
            ProprietaireId = moi.Id,
        };
        Appliquer(immeuble, requete);
        db.Immeubles.Add(immeuble);
        await db.SaveChangesAsync();
        return (await ObtenirAsync(immeuble.Id))!;
    }

    public async Task<ImmeubleDto?> ModifierAsync(int id, ImmeubleRequeteDto requete)
    {
        var immeuble = await MesImmeubles.FirstOrDefaultAsync(i => i.Id == id);
        if (immeuble is null) return null;

        Appliquer(immeuble, requete);
        await db.SaveChangesAsync();
        return await ObtenirAsync(id);
    }

    public async Task<bool> SupprimerAsync(int id)
    {
        var immeuble = await MesImmeubles.FirstOrDefaultAsync(i => i.Id == id);
        if (immeuble is null) return false;

        if (await db.Logements.AnyAsync(l => l.ImmeubleId == id))
            throw new RegleMetierException("Cet immeuble contient encore des logements : supprimez-les d'abord.");

        db.Immeubles.Remove(immeuble);
        await db.SaveChangesAsync();
        if (immeuble.PhotoId is not null) await photos.SupprimerAsync(immeuble.PhotoId);
        return true;
    }

    public async Task<ImmeubleDto?> ChangerPhotoAsync(int id, IFormFile photo)
    {
        var immeuble = await MesImmeubles.FirstOrDefaultAsync(i => i.Id == id);
        if (immeuble is null) return null;

        var ancienne = immeuble.PhotoId;
        (immeuble.PhotoUrl, immeuble.PhotoId) = await photos.EnvoyerAsync(photo, $"immopilot/immeubles/{moi.Id}");
        await db.SaveChangesAsync();
        if (ancienne is not null) await photos.SupprimerAsync(ancienne);
        return await ObtenirAsync(id);
    }

    public async Task<ImmeubleDto?> SupprimerPhotoAsync(int id)
    {
        var immeuble = await MesImmeubles.FirstOrDefaultAsync(i => i.Id == id);
        if (immeuble is null) return null;

        var ancienne = immeuble.PhotoId;
        immeuble.PhotoUrl = null;
        immeuble.PhotoId = null;
        await db.SaveChangesAsync();
        if (ancienne is not null) await photos.SupprimerAsync(ancienne);
        return await ObtenirAsync(id);
    }

    // Copie les champs de la requête dans l'entité
    private static void Appliquer(Immeuble immeuble, ImmeubleRequeteDto r)
    {
        immeuble.Nom = r.Nom.Trim();
        immeuble.Type = r.Type!.Value; // [Required] garantit la présence
        immeuble.Description = string.IsNullOrWhiteSpace(r.Description) ? null : r.Description.Trim();
        immeuble.Adresse = r.Adresse.Trim();
        immeuble.Ville = r.Ville.Trim();
        immeuble.Quartier = r.Quartier.Trim();
        immeuble.NombreEtages = r.NombreEtages;
        immeuble.AnneeConstruction = r.AnneeConstruction;
    }

    // Transformation en DTO, calculée directement par la base (une seule requête SQL)
    private static IQueryable<ImmeubleDto> VersDto(IQueryable<Immeuble> requete) =>
        requete.Select(i => new ImmeubleDto(
            i.Id,
            i.Nom,
            i.Type,
            i.Description,
            i.Adresse,
            i.Ville,
            i.Quartier,
            i.NombreEtages,
            i.AnneeConstruction,
            i.DateCreation,
            i.PhotoUrl,
            i.Logements.Count,
            i.Logements.Count(l => l.Statut == StatutLogement.Occupe)));
}
