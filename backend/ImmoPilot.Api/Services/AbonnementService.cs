using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

public class AbonnementService(
    ImmoPilotDbContext db,
    IUtilisateurCourant moi,
    IPaiementMobile paiements,
    IParametresService parametres,
    INotificationService notifications,
    IFileEmails fileEmails,
    ModelesEmail modeles,
    TimeProvider horloge,
    IConfiguration configuration,
    ILogger<AbonnementService> journal) : IAbonnementService
{
    private DateTime Maintenant => horloge.GetUtcNow().UtcDateTime;

    // ================= Bailleur =================

    public async Task<AbonnementDto> MonAbonnementAsync()
    {
        var u = await db.Utilisateurs.AsNoTracking().FirstAsync(x => x.Id == moi.Id);
        var historique = await db.PaiementsAbonnement.AsNoTracking()
            .Where(p => p.UtilisateurId == moi.Id)
            .OrderByDescending(p => p.DateCreation)
            .Take(50)
            .ToListAsync();
        var aDejaPaye = historique.Any(p => p.Statut == StatutPaiementAbonnement.Reussi);

        return new AbonnementDto(
            u.Formule,
            Abonnements.Etat(u.Formule, u.FinAbonnement, aDejaPaye, Maintenant),
            u.FinAbonnement,
            u.FinAbonnement is null ? null : (int)Math.Ceiling((u.FinAbonnement.Value - Maintenant).TotalDays),
            paiements.EstConfigure,
            paiements.EstSimulation,
            Abonnements.Offres(await parametres.ObtenirAsync()),
            historique.Select(p => VersDto(p)).ToList());
    }

    public async Task<PaiementAbonnementDto> PayerAsync(PaiementAbonnementRequeteDto r)
    {
        var formule = r.Formule!.Value;
        if (formule == Formule.Starter) throw new DonneesInvalidesException("La formule Starter est gratuite.");
        if (!Abonnements.Durees.Contains(r.DureeMois)) throw new DonneesInvalidesException("Choisissez une durée de 1, 3 ou 12 mois.");
        var telephone = Abonnements.NormaliserTelephone(r.Telephone)
            ?? throw new DonneesInvalidesException("Numéro invalide : entrez un numéro Orange Money ou MTN MoMo camerounais (ex : 677 12 34 56).");

        // Un seul paiement en attente à la fois (évite les doubles demandes sur le téléphone)
        var enCours = await db.PaiementsAbonnement.AnyAsync(p =>
            p.UtilisateurId == moi.Id && p.Statut == StatutPaiementAbonnement.EnAttente && p.DateCreation > Maintenant.AddMinutes(-5));
        if (enCours)
            throw new RegleMetierException("Un paiement est déjà en attente de validation sur votre téléphone. Patientez quelques minutes.");

        var p = await parametres.ObtenirAsync();
        var bailleur = await db.Utilisateurs.AsNoTracking().Where(u => u.Id == moi.Id)
            .Select(u => new { u.NomComplet, u.Email }).FirstAsync();
        var paiement = new PaiementAbonnement
        {
            UtilisateurId = moi.Id,
            Formule = formule,
            DureeMois = r.DureeMois,
            Montant = Abonnements.Montant(p.Prix(formule), r.DureeMois),
            Telephone = telephone,
            ReferenceExterne = Guid.NewGuid().ToString("N"),
            DateCreation = Maintenant,
        };
        db.PaiementsAbonnement.Add(paiement);
        await db.SaveChangesAsync();

        try
        {
            // Après un paiement sur la page SasPay, retour sur l'onglet Abonnement, qui suit ce paiement
            var retour = $"{AdressesSites.Site(configuration).TrimEnd('/')}/admin/parametres?onglet=abonnement&paiement={paiement.Id}";
            var demande = await paiements.DemanderPaiementAsync(paiement.Montant,
                new ClientPaiement(bailleur.NomComplet, bailleur.Email, telephone),
                $"{p.NomPlateforme} - formule {formule}, {r.DureeMois} mois", paiement.ReferenceExterne, retour);
            paiement.ReferencePaiement = demande.Reference;
            paiement.Operateur = demande.Operateur;
            await db.SaveChangesAsync();
            return VersDto(paiement, demande.CodeUssd, demande.UrlPaiement);
        }
        catch
        {
            paiement.Statut = StatutPaiementAbonnement.Echoue;
            await db.SaveChangesAsync();
            throw;
        }
    }

    public async Task<PaiementAbonnementDto?> VerifierAsync(int id)
    {
        var paiement = await db.PaiementsAbonnement.FirstOrDefaultAsync(p => p.Id == id && p.UtilisateurId == moi.Id);
        if (paiement is null) return null;
        if (paiement.Statut == StatutPaiementAbonnement.EnAttente) await ActualiserAsync(paiement);
        return VersDto(await db.PaiementsAbonnement.AsNoTracking().FirstAsync(p => p.Id == id));
    }

    // ================= Webhook SasPay =================

    public async Task<bool> ActualiserParReferenceAsync(string reference)
    {
        var paiement = await db.PaiementsAbonnement.FirstOrDefaultAsync(p => p.ReferencePaiement == reference);
        if (paiement is null) return false;

        // On ne se fie pas au contenu de la notification : le statut est redemandé à SasPay
        if (paiement.Statut == StatutPaiementAbonnement.EnAttente) await ActualiserAsync(paiement);
        return true;
    }

    // ================= Super admin =================

    public async Task<IReadOnlyList<PaiementAbonnementAdminDto>> TousAsync() =>
        await db.PaiementsAbonnement.AsNoTracking()
            .OrderByDescending(p => p.DateCreation)
            .Take(300)
            .Select(p => new PaiementAbonnementAdminDto(p.Id, p.UtilisateurId,
                p.Utilisateur.NomStructure ?? p.Utilisateur.NomComplet, p.Formule, p.DureeMois, p.Montant, p.Statut,
                p.Operateur, p.NumeroFacture, p.Manuel, p.DateCreation, p.DateConfirmation))
            .ToListAsync();

    public async Task<bool> ProlongerAsync(int utilisateurId, ProlongationDto r)
    {
        var bailleur = await db.Utilisateurs.FirstOrDefaultAsync(u => u.Id == utilisateurId && u.Role == RoleUtilisateur.Bailleur);
        if (bailleur is null) return false;
        if (r.Formule == Formule.Starter) throw new DonneesInvalidesException("La formule Starter est gratuite : rien à prolonger.");

        var p = await parametres.ObtenirAsync();
        var paiement = new PaiementAbonnement
        {
            UtilisateurId = utilisateurId,
            Formule = r.Formule!.Value,
            DureeMois = r.DureeMois,
            Montant = p.Prix(r.Formule.Value) * r.DureeMois,
            Telephone = "",
            ReferenceExterne = Guid.NewGuid().ToString("N"),
            Manuel = true,
            DateCreation = Maintenant,
        };
        db.PaiementsAbonnement.Add(paiement);
        await db.SaveChangesAsync();
        await ConfirmerAsync(paiement, operateur: "Manuel", referenceOperateur: null);
        return true;
    }

    // ================= Tâche de fond =================

    public async Task TacheDeFondAsync()
    {
        // 1. Paiements restés en attente (client qui a fermé la page, webhook non reçu) : on redemande le statut
        var enAttente = await db.PaiementsAbonnement
            .Where(p => p.Statut == StatutPaiementAbonnement.EnAttente && p.ReferencePaiement != null && p.DateCreation < Maintenant.AddMinutes(-1))
            .OrderBy(p => p.DateCreation)
            .Take(50)
            .ToListAsync();
        foreach (var paiement in enAttente)
        {
            try
            {
                await ActualiserAsync(paiement);
                // Sans réponse après 24 h, la demande est considérée comme abandonnée
                if (paiement.Statut == StatutPaiementAbonnement.EnAttente && paiement.DateCreation < Maintenant.AddDays(-1))
                    await MarquerEchoueAsync(paiement, notifier: false);
            }
            catch (Exception ex)
            {
                journal.LogWarning(ex, "Vérification du paiement d'abonnement {Id} impossible", paiement.Id);
            }
        }

        // 2. Rappel 7 jours avant l'échéance (une seule fois par échéance)
        var dans7Jours = Maintenant.AddDays(7);
        var aRappeler = await db.Utilisateurs
            .Where(u => u.Role == RoleUtilisateur.Bailleur && u.Actif && u.Formule != Formule.Starter
                        && u.FinAbonnement != null && u.FinAbonnement > Maintenant && u.FinAbonnement <= dans7Jours
                        && (u.DernierRappelAbonnement == null || u.DernierRappelAbonnement < u.FinAbonnement.Value.AddDays(-8)))
            .ToListAsync();
        foreach (var u in aRappeler)
        {
            var jours = (int)Math.Ceiling((u.FinAbonnement!.Value - Maintenant).TotalDays);
            notifications.Ajouter(u.Id, TypeNotification.Systeme, $"Votre abonnement se termine dans {jours} jour{(jours > 1 ? "s" : "")}",
                $"Renouvelez votre formule {u.Formule} depuis Paramètres → Abonnement pour continuer à gérer vos biens sans interruption.");
            u.DernierRappelAbonnement = Maintenant;
        }
        await db.SaveChangesAsync();
    }

    public async Task<EtatAbonnement> EtatAsync(int utilisateurId)
    {
        var u = await db.Utilisateurs.AsNoTracking()
            .Where(x => x.Id == utilisateurId)
            .Select(x => new { x.Formule, x.FinAbonnement })
            .FirstOrDefaultAsync();
        if (u is null) return EtatAbonnement.Gratuit;
        var aDejaPaye = await db.PaiementsAbonnement.AnyAsync(p => p.UtilisateurId == utilisateurId && p.Statut == StatutPaiementAbonnement.Reussi);
        return Abonnements.Etat(u.Formule, u.FinAbonnement, aDejaPaye, Maintenant);
    }

    // ================= Interne =================

    // Redemande le statut à SasPay et met le paiement à jour
    private async Task ActualiserAsync(PaiementAbonnement paiement)
    {
        if (paiement.ReferencePaiement is null) return;
        var statut = await paiements.StatutAsync(paiement.ReferencePaiement);
        if (statut.Etat == EtatPaiementMobile.Reussi) await ConfirmerAsync(paiement, statut.Operateur, statut.ReferenceOperateur);
        else if (statut.Etat == EtatPaiementMobile.Echoue) await MarquerEchoueAsync(paiement, notifier: true);
    }

    private async Task ConfirmerAsync(PaiementAbonnement paiement, string? operateur, string? referenceOperateur)
    {
        // Mise à jour atomique : si le webhook et la vérification arrivent en même temps, un seul confirme
        var confirme = await db.PaiementsAbonnement
            .Where(p => p.Id == paiement.Id && p.Statut == StatutPaiementAbonnement.EnAttente)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Statut, StatutPaiementAbonnement.Reussi)
                .SetProperty(p => p.DateConfirmation, Maintenant)
                .SetProperty(p => p.Operateur, p => operateur ?? p.Operateur)
                .SetProperty(p => p.ReferenceOperateur, referenceOperateur)
                .SetProperty(p => p.NumeroFacture, $"IP-{Maintenant.Year}-{paiement.Id:D6}"));
        if (confirme == 0) return; // déjà traité

        // Prolonge l'abonnement à partir de l'échéance actuelle (ou d'aujourd'hui si elle est passée)
        var bailleur = await db.Utilisateurs.FirstAsync(u => u.Id == paiement.UtilisateurId);
        var depart = bailleur.FinAbonnement is { } fin && fin > Maintenant ? fin : Maintenant;
        bailleur.Formule = paiement.Formule;
        bailleur.FinAbonnement = depart.AddMonths(paiement.DureeMois);
        bailleur.DernierRappelAbonnement = null;

        notifications.Ajouter(bailleur.Id, TypeNotification.Paiement, "Paiement de l'abonnement reçu",
            $"Merci ! {Dates.Fcfa(paiement.Montant)} reçus. Votre formule {paiement.Formule} est active jusqu'au " +
            $"{Dates.Jour(DateOnly.FromDateTime(bailleur.FinAbonnement.Value))}. Facture IP-{Maintenant.Year}-{paiement.Id:D6}.");
        await db.SaveChangesAsync();

        paiement.Statut = StatutPaiementAbonnement.Reussi;
        fileEmails.Ajouter(modeles.AbonnementPaye(bailleur.Email, bailleur.NomComplet, paiement.Formule.ToString(), paiement.DureeMois,
            paiement.Montant, DateOnly.FromDateTime(bailleur.FinAbonnement.Value), $"IP-{Maintenant.Year}-{paiement.Id:D6}"));
        journal.LogInformation("Abonnement prolongé : bailleur {Id}, {Formule}, {Mois} mois", bailleur.Id, paiement.Formule, paiement.DureeMois);
    }

    private async Task MarquerEchoueAsync(PaiementAbonnement paiement, bool notifier)
    {
        var echoue = await db.PaiementsAbonnement
            .Where(p => p.Id == paiement.Id && p.Statut == StatutPaiementAbonnement.EnAttente)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Statut, StatutPaiementAbonnement.Echoue));
        if (echoue == 0) return;

        paiement.Statut = StatutPaiementAbonnement.Echoue;
        if (notifier)
        {
            notifications.Ajouter(paiement.UtilisateurId, TypeNotification.Systeme, "Paiement de l'abonnement non abouti",
                "Le paiement n'a pas été validé (solde insuffisant, code erroné ou demande expirée). Vous pouvez réessayer depuis Paramètres → Abonnement.");
            await db.SaveChangesAsync();
        }
    }

    private static PaiementAbonnementDto VersDto(PaiementAbonnement p, string? codeUssd = null, string? urlPaiement = null) =>
        new(p.Id, p.Formule, p.DureeMois, p.Montant, p.Telephone, p.Statut, p.Operateur, codeUssd, urlPaiement, p.NumeroFacture, p.Manuel,
            p.DateCreation, p.DateConfirmation);
}
