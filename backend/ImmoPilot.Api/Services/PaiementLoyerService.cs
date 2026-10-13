using System.Security.Cryptography;
using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace ImmoPilot.Api.Services;

// Le locataire paie son loyer depuis son lien personnel.
// Pour l'instant, l'encaissement passe TOUJOURS par le simulateur (aucun argent réel) :
// il restera à choisir sur quel compte l'argent des loyers doit arriver avant de brancher le vrai CamPay.
public class PaiementLoyerService(
    ImmoPilotDbContext db,
    SimulateurCampay operateur,
    INotificationService notifications,
    IFileEmails fileEmails,
    ModelesEmail modeles,
    TimeProvider horloge) : IPaiementLoyerService
{
    private const int MoisAffiches = 12; // au plus 12 mois en arrière
    private static readonly TimeSpan AttenteMax = TimeSpan.FromMinutes(10); // ensuite, demande abandonnée

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
            Simulation: true,
            Beneficiaire(l) is { } b ? $"{b.Nom} · {CompteMasque(b.Compte)}" : null,
            await MoisDusAsync(l),
            derniers.Select(p => VersDto(p, codeUssd: null)).ToList());
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

        await AbandonnerAnciennesDemandesAsync(l.Id);
        if (await db.Paiements.AnyAsync(p => p.LocataireId == l.Id && p.EnLigne && p.Statut == StatutPaiement.EnAttente))
            throw new RegleMetierException("Un paiement est déjà en attente de validation sur votre téléphone. Validez-le ou patientez quelques minutes.");

        var mois = Dates.PremierDuMois(r.Mois!.Value);
        var du = (await MoisDusAsync(l)).FirstOrDefault(m => m.Mois == mois)
                 ?? throw new RegleMetierException("Ce mois n'a rien à payer (déjà réglé ou hors de votre bail).");

        var demande = await operateur.DemanderPaiementAsync(du.Reste, telephone,
            $"Loyer {Dates.NomMois(mois)} - {l.NomComplet}", $"LOYER-{l.Id}-{mois:yyyyMM}");

        var paiement = new Paiement
        {
            LocataireId = l.Id,
            Montant = du.Reste,
            DatePaiement = Dates.Aujourdhui(horloge),
            Periode = mois,
            Moyen = demande.Operateur == "MTN" ? MoyenPaiement.MtnMomo : MoyenPaiement.OrangeMoney,
            Reference = demande.Reference,
            Statut = StatutPaiement.EnAttente,
            EnLigne = true,
            DateDemande = horloge.GetUtcNow().UtcDateTime,
            CompteVersement = beneficiaire.Compte, // l'argent part sur le compte du propriétaire du logement
        };
        db.Paiements.Add(paiement);
        await db.SaveChangesAsync();
        return VersDto(paiement, demande.CodeUssd);
    }

    public async Task<PaiementLoyerDto?> VerifierAsync(string jeton, int paiementId)
    {
        var l = await LocataireAsync(jeton);
        if (l is null) return null;
        var p = await db.Paiements.FirstOrDefaultAsync(x => x.Id == paiementId && x.LocataireId == l.Id);
        if (p is null) return null;

        if (p.EnLigne && p.Statut == StatutPaiement.EnAttente && p.Reference is not null)
        {
            var statut = await operateur.StatutAsync(p.Reference);
            var nouveau = statut.Statut switch
            {
                "SUCCESSFUL" => StatutPaiement.Confirme,
                "FAILED" => StatutPaiement.Echoue,
                _ when horloge.GetUtcNow().UtcDateTime - p.DateDemande > AttenteMax => StatutPaiement.Echoue,
                _ => StatutPaiement.EnAttente,
            };

            // Mise à jour atomique : une seule requête peut faire passer le paiement de « en attente » à « confirmé »
            if (nouveau != StatutPaiement.EnAttente
                && await db.Paiements.Where(x => x.Id == p.Id && x.Statut == StatutPaiement.EnAttente)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.Statut, nouveau)
                        .SetProperty(x => x.DatePaiement, Dates.Aujourdhui(horloge))) == 1)
            {
                p.Statut = nouveau;
                if (nouveau == StatutPaiement.Confirme)
                {
                    notifications.Ajouter(l.ProprietaireId, TypeNotification.Paiement, $"Loyer payé en ligne — {l.NomComplet}",
                        $"{Dates.Fcfa(p.Montant)} reçus pour {Dates.NomMois(p.Periode)} ({(p.Moyen == MoyenPaiement.MtnMomo ? "MTN MoMo" : "Orange Money")}, réf. {p.Reference}), "
                        + $"versés sur le compte {CompteMasque(p.CompteVersement ?? "")}"
                        + (Beneficiaire(l) is { } b && b.Compte == p.CompteVersement ? $" ({b.Nom})." : "."));
                    await db.SaveChangesAsync();

                    var bailleur = l.Proprietaire.NomStructure ?? l.Proprietaire.NomComplet;
                    var logement = l.Logement is null ? "votre logement" : $"{l.Logement.Reference} · {l.Logement.Immeuble.Nom}";
                    var compte = CompteMasque(p.CompteVersement ?? "") + (Beneficiaire(l) is { } be && be.Compte == p.CompteVersement ? $" ({be.Nom})" : "");
                    fileEmails.Ajouter(modeles.RecuLoyer(l.Email, l.NomComplet, logement, p.Montant, p.Periode, Dates.Aujourdhui(horloge),
                        p.Moyen == MoyenPaiement.MtnMomo ? "MTN MoMo" : "Orange Money", p.Reference, bailleur, l.Proprietaire.Email, l.JetonPaiement));
                    fileEmails.Ajouter(modeles.LoyerRecuBailleur(l.Proprietaire.Email, l.NomComplet, logement, p.Montant, p.Periode, compte));
                }
            }
        }
        return VersDto(p, codeUssd: null);
    }

    // ---- Outils ----

    private Task<Locataire?> LocataireAsync(string jeton) =>
        string.IsNullOrWhiteSpace(jeton) || jeton.Length > 64
            ? Task.FromResult<Locataire?>(null)
            : db.Locataires
                .Include(l => l.Proprietaire)
                .Include(l => l.Logement).ThenInclude(g => g!.Immeuble)
                .FirstOrDefaultAsync(l => l.JetonPaiement == jeton && l.Proprietaire.Actif);

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

    // Une demande jamais validée bloquerait les suivantes : au-delà de 10 minutes, elle est abandonnée
    private Task AbandonnerAnciennesDemandesAsync(int locataireId)
    {
        var limite = horloge.GetUtcNow().UtcDateTime - AttenteMax;
        return db.Paiements
            .Where(p => p.LocataireId == locataireId && p.EnLigne && p.Statut == StatutPaiement.EnAttente && p.DateDemande < limite)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Statut, StatutPaiement.Echoue));
    }

    // Propriétaire qui reçoit le loyer : logement → immeuble → bailleur
    private static Beneficiaires.Beneficiaire? Beneficiaire(Locataire l) =>
        Beneficiaires.Resoudre(
            l.Logement?.BeneficiaireCompte, l.Logement?.BeneficiaireNom,
            l.Logement?.Immeuble.BeneficiaireCompte, l.Logement?.Immeuble.BeneficiaireNom,
            l.Proprietaire.CompteEncaissement, l.Proprietaire.NomStructure ?? l.Proprietaire.NomComplet);

    // « MTN MoMo •••• 34 56 » : on ne montre que la fin du numéro
    public static string CompteMasque(string compte)
    {
        var operateur = compte.Length >= 6 && (compte[3..5] == "67" || compte[3..6] is "650" or "651" or "652" or "653" or "654" or "680" or "681" or "682" or "683" or "684")
            ? "MTN MoMo" : "Orange Money";
        return compte.Length < 4 ? operateur : $"{operateur} •••• {compte[^4..^2]} {compte[^2..]}";
    }

    private static PaiementLoyerDto VersDto(Paiement p, string? codeUssd) =>
        new(p.Id, p.Periode, p.Montant, p.Statut, p.DatePaiement,
            p.Moyen switch { MoyenPaiement.MtnMomo => "MTN MoMo", MoyenPaiement.OrangeMoney => "Orange Money", MoyenPaiement.Especes => "Espèces", _ => "Virement" },
            codeUssd, p.Reference);
}
