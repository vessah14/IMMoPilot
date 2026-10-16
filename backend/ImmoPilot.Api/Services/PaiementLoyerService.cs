using System.Security.Cryptography;
using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

// Le locataire paie son loyer depuis son lien personnel, par SasPay (ou le simulateur en développement / démo).
// L'argent arrive d'abord sur le wallet SasPay d'IMMO PILOT, puis il est reversé automatiquement au propriétaire
// du logement (payout) : le locataire paie le loyer exact, les frais d'encaissement et de reversement sont déduits
// de ce que reçoit le propriétaire. Un reversement qui ne part pas tout de suite est réessayé par la tâche de fond.
public class PaiementLoyerService(
    ImmoPilotDbContext db,
    IPaiementMobile paiements,
    INotificationService notifications,
    IFileEmails fileEmails,
    ModelesEmail modeles,
    IConfiguration configuration,
    TimeProvider horloge,
    ILogger<PaiementLoyerService> journal) : IPaiementLoyerService
{
    private const int MoisAffiches = 12; // au plus 12 mois en arrière
    private const int EchecsMax = 3; // reversements refusés par l'opérateur avant abandon
    private static readonly TimeSpan AttenteValidation = TimeSpan.FromMinutes(10); // ensuite, une nouvelle demande est permise
    private static readonly TimeSpan AbandonDemande = TimeSpan.FromHours(24); // demande jamais validée : échouée
    private static readonly TimeSpan EcartEssais = TimeSpan.FromMinutes(10); // entre deux essais de reversement
    private static readonly TimeSpan AbandonReversement = TimeSpan.FromDays(7); // reversement impossible : à régler à la main

    private DateTime Maintenant => horloge.GetUtcNow().UtcDateTime;

    // Lien secret d'un locataire : 32 octets aléatoires, impossible à deviner
    public static string NouveauJeton() => WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

    public async Task<PageLoyerDto?> PageAsync(string jeton)
    {
        var l = await LocataireAsync(jeton);
        if (l is null) return null;

        var derniers = await db.Paiements.AsNoTracking()
            .Where(p => p.LocataireId == l.Id)
            .OrderByDescending(p => p.Id)
            .Take(6)
            .ToListAsync();

        return new PageLoyerDto(
            l.NomComplet,
            l.Logement is null ? null : $"{l.Logement.Reference} · {l.Logement.Immeuble.Nom}",
            l.Proprietaire.NomStructure ?? l.Proprietaire.NomComplet,
            l.Proprietaire.Telephone,
            l.Loyer,
            paiements.EstSimulation,
            paiements.EstConfigure && Beneficiaire(l) is { } b ? $"{b.Nom} · {CompteMasque(b.Compte)}" : null,
            await MoisDusAsync(l),
            derniers.Select(p => VersDto(p)).ToList());
    }

    public async Task<PaiementLoyerDto?> PayerAsync(string jeton, PaiementLoyerRequeteDto r)
    {
        var l = await LocataireAsync(jeton);
        if (l is null) return null;
        if (l.LogementId is null)
            throw new RegleMetierException("Votre bail est terminé : contactez votre bailleur.");
        var beneficiaire = Beneficiaire(l)
                           ?? throw new RegleMetierException("Votre bailleur n'a pas encore activé le paiement en ligne : contactez-le.");

        var telephone = Abonnements.NormaliserTelephone(r.Telephone)
                        ?? throw new DonneesInvalidesException("Numéro invalide : saisissez un numéro Orange Money ou MTN MoMo du Cameroun (ex : 677 12 34 56).");

        // Une seule demande à valider à la fois ; au-delà de 10 minutes sans validation, une nouvelle est permise
        // (l'ancienne reste suivie : si elle finit par être payée, elle est bien comptée)
        var limite = Maintenant - AttenteValidation;
        if (await db.Paiements.AnyAsync(p => p.LocataireId == l.Id && p.EnLigne && p.Statut == StatutPaiement.EnAttente && p.DateDemande > limite))
            throw new RegleMetierException("Un paiement est déjà en attente de validation. Validez-le ou patientez quelques minutes.");

        var mois = Dates.PremierDuMois(r.Mois!.Value);
        var du = (await MoisDusAsync(l)).FirstOrDefault(m => m.Mois == mois)
                 ?? throw new RegleMetierException("Ce mois n'a rien à payer (déjà réglé ou hors de votre bail).");

        // Enregistré avant l'appel au prestataire : son numéro sert de référence unique et d'adresse de retour
        var paiement = new Paiement
        {
            LocataireId = l.Id,
            Montant = du.Reste,
            DatePaiement = Dates.Aujourdhui(horloge),
            Periode = mois,
            Moyen = Operateurs.De(telephone) == Operateurs.Mtn ? MoyenPaiement.MtnMomo : MoyenPaiement.OrangeMoney,
            Statut = StatutPaiement.EnAttente,
            EnLigne = true,
            DateDemande = Maintenant,
            CompteVersement = beneficiaire.Compte, // l'argent sera reversé au propriétaire du logement
        };
        db.Paiements.Add(paiement);
        await db.SaveChangesAsync();

        try
        {
            var retour = $"{AdressesSites.Site(configuration).TrimEnd('/')}/payer/{Uri.EscapeDataString(jeton)}?paiement={paiement.Id}";
            var demande = await paiements.DemanderPaiementAsync(du.Reste, new ClientPaiement(l.NomComplet, l.Email, telephone),
                $"Loyer {Dates.NomMois(mois)} - {l.NomComplet}", $"LOYER-{paiement.Id}", retour);
            paiement.Reference = demande.Reference;
            await db.SaveChangesAsync();
            return VersDto(paiement, demande.CodeUssd, demande.UrlPaiement);
        }
        catch
        {
            paiement.Statut = StatutPaiement.Echoue;
            await db.SaveChangesAsync();
            throw;
        }
    }

    public async Task<PaiementLoyerDto?> VerifierAsync(string jeton, int paiementId)
    {
        var l = await LocataireAsync(jeton);
        if (l is null) return null;
        var p = await db.Paiements.FirstOrDefaultAsync(x => x.Id == paiementId && x.LocataireId == l.Id);
        if (p is null) return null;

        if (p.EnLigne && p.Statut == StatutPaiement.EnAttente && p.Reference is not null) await ActualiserAsync(p, l);
        return VersDto(p);
    }

    // Webhook SasPay : paiement de loyer ou reversement concerné par la notification (false si aucun)
    public async Task<bool> ActualiserParReferenceAsync(string reference)
    {
        var paiement = await db.Paiements.FirstOrDefaultAsync(p => p.EnLigne && p.Reference == reference);
        if (paiement is not null)
        {
            if (paiement.Statut == StatutPaiement.EnAttente)
                await ActualiserAsync(paiement, await LocataireParIdAsync(paiement.LocataireId));
            return true;
        }

        var reversement = await db.Paiements.FirstOrDefaultAsync(p => p.ReferenceReversement == reference);
        if (reversement is null) return false;
        if (reversement.StatutReversement == StatutReversement.EnCours)
            await ActualiserReversementAsync(reversement, await LocataireParIdAsync(reversement.LocataireId));
        return true;
    }

    // Tâche de fond : demandes restées en attente (page fermée, webhook non reçu) et reversements à (re)faire
    public async Task TacheDeFondAsync()
    {
        var limite = Maintenant.AddMinutes(-1);
        var enAttente = await db.Paiements
            .Where(p => p.EnLigne && p.Statut == StatutPaiement.EnAttente && p.Reference != null && p.DateDemande < limite)
            .OrderBy(p => p.DateDemande)
            .Take(50)
            .ToListAsync();
        foreach (var p in enAttente)
            await SansPlanterAsync(p, async () => await ActualiserAsync(p, await LocataireParIdAsync(p.LocataireId)));

        var essai = Maintenant - EcartEssais;
        var aReverser = await db.Paiements
            .Where(p => p.StatutReversement == StatutReversement.AFaire && (p.DateReversement == null || p.DateReversement < essai)
                        || p.StatutReversement == StatutReversement.EnCours && p.DateReversement < essai)
            .OrderBy(p => p.DateReversement)
            .Take(50)
            .ToListAsync();
        foreach (var p in aReverser)
            await SansPlanterAsync(p, async () =>
            {
                var l = await LocataireParIdAsync(p.LocataireId);
                if (p.StatutReversement == StatutReversement.EnCours && p.ReferenceReversement is not null)
                    await ActualiserReversementAsync(p, l);
                else
                {
                    // Envoi interrompu avant d'obtenir une réponse : on le renvoie avec la même clé (aucun double versement)
                    if (p.StatutReversement == StatutReversement.EnCours) p.StatutReversement = StatutReversement.AFaire;
                    await db.SaveChangesAsync();
                    await ReverserAsync(p, l);
                }
            });
    }

    public async Task<bool> RelancerReversementAsync(int paiementId)
    {
        var p = await db.Paiements.FirstOrDefaultAsync(x => x.Id == paiementId && x.StatutReversement != null);
        if (p is null || p.StatutReversement == StatutReversement.Reverse) return false;
        // Reversement déjà envoyé et en attente de réponse : on redemande son statut au lieu de le renvoyer
        if (p.StatutReversement == StatutReversement.EnCours && p.ReferenceReversement is not null)
        {
            await ActualiserReversementAsync(p, await LocataireParIdAsync(p.LocataireId));
            return true;
        }

        // Nouveau départ : nouvelle clé (aucun envoi précédent n'a abouti), compteur d'échecs remis à zéro
        p.StatutReversement = StatutReversement.AFaire;
        p.EchecsReversement = 0;
        p.CleReversement = NouvelleCle(p);
        p.ReferenceReversement = null;
        p.ErreurReversement = null;
        await db.SaveChangesAsync();
        journal.LogInformation("Reversement du loyer {Id} relancé par le super admin", p.Id);
        await ReverserAsync(p, await LocataireParIdAsync(p.LocataireId));
        return true;
    }

    // ---- Encaissement ----

    // Redemande le statut au prestataire et met le paiement à jour
    private async Task ActualiserAsync(Paiement p, Locataire l)
    {
        var statut = await paiements.StatutAsync(p.Reference!);
        var nouveau = statut.Etat switch
        {
            EtatPaiementMobile.Reussi => StatutPaiement.Confirme,
            EtatPaiementMobile.Echoue => StatutPaiement.Echoue,
            _ when Maintenant - p.DateDemande > AbandonDemande => StatutPaiement.Echoue,
            _ => StatutPaiement.EnAttente,
        };
        if (nouveau == StatutPaiement.EnAttente) return;

        var net = statut.MontantNet ?? p.Montant;
        // Mise à jour atomique : une seule requête peut faire passer le paiement de « en attente » à « confirmé »
        var change = nouveau == StatutPaiement.Confirme
            ? await db.Paiements.Where(x => x.Id == p.Id && x.Statut == StatutPaiement.EnAttente)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Statut, StatutPaiement.Confirme)
                    .SetProperty(x => x.DatePaiement, Dates.Aujourdhui(horloge))
                    .SetProperty(x => x.MontantNet, net)
                    .SetProperty(x => x.StatutReversement, StatutReversement.AFaire)
                    .SetProperty(x => x.CleReversement, $"REV-{p.Id}-1"))
            : await db.Paiements.Where(x => x.Id == p.Id && x.Statut == StatutPaiement.EnAttente)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Statut, StatutPaiement.Echoue));
        if (change == 0) return; // déjà traité (webhook et vérification en même temps)

        await db.Entry(p).ReloadAsync();
        if (nouveau != StatutPaiement.Confirme) return;

        var operateur = p.Moyen == MoyenPaiement.MtnMomo ? "MTN MoMo" : "Orange Money";
        var compte = Destinataire(p, l);
        notifications.Ajouter(l.ProprietaireId, TypeNotification.Paiement, $"Loyer payé en ligne — {l.NomComplet}",
            $"{Dates.Fcfa(p.Montant)} reçus pour {Dates.NomMois(p.Periode)} ({operateur}, réf. {p.Reference}). "
            + $"Le reversement sur le compte {compte} est en cours (frais de paiement déduits).");
        await db.SaveChangesAsync();

        var bailleur = l.Proprietaire.NomStructure ?? l.Proprietaire.NomComplet;
        var logement = l.Logement is null ? "votre logement" : $"{l.Logement.Reference} · {l.Logement.Immeuble.Nom}";
        fileEmails.Ajouter(modeles.RecuLoyer(l.Email, l.NomComplet, logement, p.Montant, p.Periode, Dates.Aujourdhui(horloge),
            operateur, p.Reference, bailleur, l.Proprietaire.Email, l.JetonPaiement));
        fileEmails.Ajouter(modeles.LoyerRecuBailleur(l.Proprietaire.Email, l.NomComplet, logement, p.Montant, p.Periode, compte));

        // Reversement immédiat ; en cas d'échec, la tâche de fond réessaiera
        await SansPlanterAsync(p, () => ReverserAsync(p, l));
    }

    // ---- Reversement au propriétaire ----

    private async Task ReverserAsync(Paiement p, Locataire l)
    {
        // Réservation atomique : un seul envoi à la fois pour ce loyer (vérification de la page, webhook, tâche de fond)
        var reserve = await db.Paiements
            .Where(x => x.Id == p.Id && x.StatutReversement == StatutReversement.AFaire)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.StatutReversement, StatutReversement.EnCours)
                .SetProperty(x => x.DateReversement, Maintenant));
        if (reserve == 0) return;
        await db.Entry(p).ReloadAsync();

        if (p.CompteVersement is null || p.MontantNet is not > 0m)
        {
            await AbandonnerAsync(p, l, "Compte de réception ou montant manquant");
            return;
        }

        var demande = await paiements.ReverserAsync(p.MontantNet.Value, p.CompteVersement, Destinataire(p, l, masque: false),
            $"Loyer {Dates.NomMois(p.Periode)} - {l.NomComplet}", p.CleReversement ?? $"REV-{p.Id}-1");

        switch (demande.Resultat)
        {
            case ResultatReversement.Accepte:
                p.ReferenceReversement = demande.Reference;
                p.ErreurReversement = null;
                await db.SaveChangesAsync();
                await ActualiserReversementAsync(p, l); // le simulateur et certains réseaux confirment tout de suite
                break;

            case ResultatReversement.Incertain: // même clé au prochain essai : impossible de verser deux fois
            case ResultatReversement.NonEnvoye:
                p.StatutReversement = StatutReversement.AFaire;
                if (demande.Resultat == ResultatReversement.NonEnvoye) p.CleReversement = NouvelleCle(p);
                p.ErreurReversement = Tronquer(demande.Erreur);
                await db.SaveChangesAsync();
                if (Maintenant - p.DateDemande > AbandonReversement) await AbandonnerAsync(p, l, demande.Erreur);
                break;

            default:
                await AbandonnerAsync(p, l, demande.Erreur);
                break;
        }
    }

    private async Task ActualiserReversementAsync(Paiement p, Locataire l)
    {
        var statut = await paiements.StatutReversementAsync(p.ReferenceReversement!);
        if (statut.Etat == EtatPaiementMobile.EnAttente) return;

        if (statut.Etat == EtatPaiementMobile.Reussi)
        {
            var recu = await db.Paiements.Where(x => x.Id == p.Id && x.StatutReversement == StatutReversement.EnCours)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.StatutReversement, StatutReversement.Reverse)
                    .SetProperty(x => x.MontantReverse, statut.MontantNet ?? p.MontantNet)
                    .SetProperty(x => x.DateReversement, Maintenant)
                    .SetProperty(x => x.ErreurReversement, (string?)null));
            if (recu == 0) return;
            await db.Entry(p).ReloadAsync();

            notifications.Ajouter(l.ProprietaireId, TypeNotification.Paiement, $"Loyer reversé — {l.NomComplet}",
                $"{Dates.Fcfa(p.MontantReverse ?? 0)} envoyés sur le compte {Destinataire(p, l)} pour le loyer de "
                + $"{Dates.NomMois(p.Periode)} ({Dates.Fcfa(p.Montant)} payés, frais déduits).");
            await db.SaveChangesAsync();
            journal.LogInformation("Loyer {Id} reversé : {Montant} FCFA", p.Id, p.MontantReverse);
            return;
        }

        // Refusé par l'opérateur : nouvel essai avec une nouvelle clé, abandon au 3e refus
        p.EchecsReversement++;
        p.ReferenceReversement = null;
        if (p.EchecsReversement >= EchecsMax)
        {
            await AbandonnerAsync(p, l, "Reversement refusé par l'opérateur à plusieurs reprises");
            return;
        }
        p.StatutReversement = StatutReversement.AFaire;
        p.CleReversement = NouvelleCle(p);
        p.ErreurReversement = "Refusé par l'opérateur, nouvel essai prévu";
        await db.SaveChangesAsync();
    }

    // Reversement impossible : l'argent reste sur le wallet SasPay, à reverser à la main
    private async Task AbandonnerAsync(Paiement p, Locataire l, string? raison)
    {
        p.StatutReversement = StatutReversement.Echoue;
        p.ErreurReversement = Tronquer(raison);
        notifications.Ajouter(l.ProprietaireId, TypeNotification.Systeme, $"Reversement du loyer en attente — {l.NomComplet}",
            $"Le loyer de {Dates.NomMois(p.Periode)} ({Dates.Fcfa(p.Montant)}) a bien été payé, mais son reversement sur le compte "
            + $"{Destinataire(p, l)} n'a pas abouti. Vérifiez ce numéro de réception et contactez le support : nous vous le reverserons.");
        await db.SaveChangesAsync();
        journal.LogError("Reversement du loyer {Id} abandonné ({Montant} FCFA vers {Compte}) : {Raison}",
            p.Id, p.MontantNet, CompteMasque(p.CompteVersement ?? ""), raison);
    }

    // Une erreur sur un loyer ne doit bloquer ni la page du locataire ni les autres loyers
    private async Task SansPlanterAsync(Paiement p, Func<Task> action)
    {
        try
        {
            await action();
        }
        catch (Exception ex)
        {
            journal.LogWarning(ex, "Traitement du loyer {Id} impossible pour l'instant (nouvel essai plus tard)", p.Id);
        }
    }

    // Nouvelle clé d'idempotence pour un nouvel essai (au plus ~45 caractères : la colonne en accepte 100)
    private static string NouvelleCle(Paiement p) => $"REV-{p.Id}-{Guid.NewGuid():N}";

    private static string? Tronquer(string? texte) => texte is { Length: > 300 } ? texte[..300] : texte;

    // ---- Outils ----

    private Task<Locataire?> LocataireAsync(string jeton) =>
        string.IsNullOrWhiteSpace(jeton) || jeton.Length > 64
            ? Task.FromResult<Locataire?>(null)
            : Locataires().FirstOrDefaultAsync(l => l.JetonPaiement == jeton && l.Proprietaire.Actif);

    private Task<Locataire> LocataireParIdAsync(int id) => Locataires().FirstAsync(l => l.Id == id);

    private IQueryable<Locataire> Locataires() =>
        db.Locataires
            .Include(l => l.Proprietaire)
            .Include(l => l.Logement).ThenInclude(g => g!.Immeuble);

    // Mois du bail (12 derniers au plus, jusqu'au mois en cours) dont le loyer n'est pas entièrement payé
    private async Task<IReadOnlyList<MoisDuDto>> MoisDusAsync(Locataire l)
    {
        if (l.Loyer <= 0) return [];
        var moisCourant = Dates.PremierDuMois(Dates.Aujourdhui(horloge));
        var premier = Dates.PremierDuMois(l.DebutBail) > moisCourant.AddMonths(-(MoisAffiches - 1))
            ? Dates.PremierDuMois(l.DebutBail)
            : moisCourant.AddMonths(-(MoisAffiches - 1));

        var payes = await db.Paiements.AsNoTracking()
            .Where(p => p.LocataireId == l.Id && p.Statut == StatutPaiement.Confirme && p.Periode >= premier && p.Periode <= moisCourant)
            .GroupBy(p => p.Periode)
            .Select(g => new { Mois = g.Key, Total = g.Sum(p => p.Montant) })
            .ToDictionaryAsync(x => x.Mois, x => x.Total);

        var resultat = new List<MoisDuDto>();
        for (var m = premier; m <= moisCourant; m = m.AddMonths(1))
        {
            if (!Soldes.BailCouvre(l.DebutBail, l.FinBail, m)) continue;
            var paye = payes.GetValueOrDefault(m);
            if (paye < l.Loyer)
                resultat.Add(new MoisDuDto(m, l.Loyer, paye, l.Loyer - paye, Soldes.Statut(l.Loyer, paye, m, moisCourant)));
        }
        return resultat;
    }

    // Propriétaire qui reçoit le loyer : logement → immeuble → bailleur
    private static Beneficiaires.Beneficiaire? Beneficiaire(Locataire l) =>
        Beneficiaires.Resoudre(
            l.Logement?.BeneficiaireCompte, l.Logement?.BeneficiaireNom,
            l.Logement?.Immeuble.BeneficiaireCompte, l.Logement?.Immeuble.BeneficiaireNom,
            l.Proprietaire.CompteEncaissement, l.Proprietaire.NomStructure ?? l.Proprietaire.NomComplet);

    // « MTN MoMo •••• 34 56 (Agence Kamga) » ; masque: false → nom du titulaire seul, pour le prestataire
    private static string Destinataire(Paiement p, Locataire l, bool masque = true)
    {
        var b = Beneficiaire(l);
        var nom = b is not null && b.Compte == p.CompteVersement ? b.Nom : l.Proprietaire.NomStructure ?? l.Proprietaire.NomComplet;
        return masque ? $"{CompteMasque(p.CompteVersement ?? "")} ({nom})" : nom;
    }

    // « MTN MoMo •••• 34 56 » : on ne montre que la fin du numéro
    public static string CompteMasque(string compte)
    {
        var operateur = Operateurs.De(compte) == Operateurs.Mtn ? "MTN MoMo" : "Orange Money";
        return compte.Length < 4 ? operateur : $"{operateur} •••• {compte[^4..^2]} {compte[^2..]}";
    }

    private static PaiementLoyerDto VersDto(Paiement p, string? codeUssd = null, string? urlPaiement = null) =>
        new(p.Id, p.Periode, p.Montant, p.Statut, p.DatePaiement,
            p.Moyen switch { MoyenPaiement.MtnMomo => "MTN MoMo", MoyenPaiement.OrangeMoney => "Orange Money", MoyenPaiement.Especes => "Espèces", _ => "Virement" },
            codeUssd, urlPaiement, p.Reference);
}
