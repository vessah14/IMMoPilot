using ImmoPilot.Api.Data;
using ImmoPilot.Api.Dtos;
using ImmoPilot.Api.Exceptions;
using ImmoPilot.Api.Interfaces;
using ImmoPilot.Api.Models;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ImmoPilot.Api.Services;

public class AuthService(
    ImmoPilotDbContext db,
    IUtilisateurCourant moi,
    IParametresService parametres,
    INotificationService notifications,
    IPasswordHasher<Utilisateur> hacheur,
    IEnvoiEmail emails,
    IFileEmails fileEmails,
    ModelesEmail modeles,
    IConfiguration configuration,
    TimeProvider horloge,
    IMemoryCache cache) : IAuthService
{
    public async Task<Utilisateur> InscrireAsync(InscriptionDto r)
    {
        var p = await parametres.ObtenirAsync();
        if (!p.InscriptionsOuvertes)
            throw new RegleMetierException("Les inscriptions sont momentanément fermées.");

        var email = NormaliserEmail(r.Email);
        if (await db.Utilisateurs.AnyAsync(u => u.Email == email))
            throw new RegleMetierException("Un compte existe déjà avec cet e-mail.");

        if (r.Profil is ProfilGestion.Agence or ProfilGestion.Sci && string.IsNullOrWhiteSpace(r.NomStructure))
            throw new DonneesInvalidesException("Le nom de l'agence ou de la société est obligatoire.");

        var utilisateur = new Utilisateur
        {
            NomComplet = r.NomComplet.Trim(),
            Email = email,
            Telephone = r.Telephone.Trim(),
            CompteEncaissement = CompteValide(r.CompteEncaissement),
            Role = RoleUtilisateur.Bailleur,
            Profil = r.Profil,
            NomStructure = string.IsNullOrWhiteSpace(r.NomStructure) ? null : r.NomStructure.Trim(),
            Ville = r.Ville.Trim(),
            Formule = r.Formule!.Value,
            DerniereConnexion = horloge.GetUtcNow().UtcDateTime,
            // Starter : gratuit, sans échéance. Pro / Enterprise : essai gratuit, puis paiement
            FinAbonnement = r.Formule == Formule.Starter ? null : horloge.GetUtcNow().UtcDateTime.AddDays(p.DureeEssaiJours),
        };
        utilisateur.MotDePasseHash = hacheur.HashPassword(utilisateur, r.MotDePasse);
        db.Utilisateurs.Add(utilisateur);
        await db.SaveChangesAsync();

        notifications.Ajouter(utilisateur.Id, TypeNotification.Systeme, $"Bienvenue sur {p.NomPlateforme} !",
            "Commencez par ajouter votre premier immeuble, puis ses logements et vos locataires.");
        await db.SaveChangesAsync();

        fileEmails.Ajouter(modeles.Bienvenue(utilisateur.Email, utilisateur.NomComplet,
            essai: utilisateur.FinAbonnement is not null, p.DureeEssaiJours));
        return utilisateur;
    }

    public async Task<Utilisateur?> ConnecterAsync(ConnexionDto r, RoleUtilisateur role)
    {
        var email = NormaliserEmail(r.Email);
        var utilisateur = await db.Utilisateurs.FirstOrDefaultAsync(u => u.Email == email && u.Role == role);

        // Même réponse (null) que le compte existe ou non : on ne révèle pas les e-mails inscrits.
        // On calcule quand même un hachage pour que le temps de réponse soit le même.
        if (utilisateur is null)
        {
            hacheur.HashPassword(new Utilisateur { NomComplet = "", Email = "", Telephone = "" }, r.MotDePasse);
            return null;
        }
        var resultat = hacheur.VerifyHashedPassword(utilisateur, utilisateur.MotDePasseHash, r.MotDePasse);
        if (resultat == PasswordVerificationResult.Failed) return null;

        if (!utilisateur.Actif)
            throw new RegleMetierException("Ce compte est suspendu. Contactez le support IMMO PILOT.");

        if (resultat == PasswordVerificationResult.SuccessRehashNeeded)
            utilisateur.MotDePasseHash = hacheur.HashPassword(utilisateur, r.MotDePasse);
        utilisateur.DerniereConnexion = horloge.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync();
        return utilisateur;
    }

    public async Task<UtilisateurDto> MoiAsync()
    {
        var u = await db.Utilisateurs.AsNoTracking().FirstAsync(u => u.Id == moi.Id);
        var p = await parametres.ObtenirAsync();
        var aDejaPaye = await db.PaiementsAbonnement.AnyAsync(x => x.UtilisateurId == u.Id && x.Statut == StatutPaiementAbonnement.Reussi);

        return new UtilisateurDto(
            u.Id,
            u.NomComplet,
            u.Email,
            u.Telephone,
            u.Role,
            u.Profil,
            u.NomStructure,
            u.Ville,
            u.Adresse,
            u.Formule,
            p.Prix(u.Formule),
            u.JourEcheance,
            u.DateInscription,
            u.FinAbonnement,
            Abonnements.Etat(u.Formule, u.FinAbonnement, aDejaPaye, horloge.GetUtcNow().UtcDateTime),
            await db.Notifications.CountAsync(n => n.UtilisateurId == u.Id && !n.Lue),
            new UtilisationDto(
                await db.Immeubles.CountAsync(i => i.ProprietaireId == u.Id),
                LimitesFormule.Immeubles(u.Formule),
                await db.Locataires.CountAsync(l => l.ProprietaireId == u.Id && l.LogementId != null),
                LimitesFormule.Locataires(u.Formule)),
            u.CompteEncaissement);
    }

    public async Task<UtilisateurDto> ModifierProfilAsync(ProfilDto r)
    {
        var u = await db.Utilisateurs.FirstAsync(u => u.Id == moi.Id);
        u.NomComplet = r.NomComplet.Trim();
        u.Telephone = r.Telephone.Trim();
        u.NomStructure = string.IsNullOrWhiteSpace(r.NomStructure) ? null : r.NomStructure.Trim();
        u.Ville = string.IsNullOrWhiteSpace(r.Ville) ? null : r.Ville.Trim();
        u.Adresse = string.IsNullOrWhiteSpace(r.Adresse) ? null : r.Adresse.Trim();
        u.JourEcheance = r.JourEcheance;
        if (!string.IsNullOrWhiteSpace(r.CompteEncaissement)) u.CompteEncaissement = CompteValide(r.CompteEncaissement);
        await db.SaveChangesAsync();
        return await MoiAsync();
    }

    public async Task ChangerMotDePasseAsync(ChangementMotDePasseDto r)
    {
        var u = await db.Utilisateurs.FirstAsync(u => u.Id == moi.Id);
        if (hacheur.VerifyHashedPassword(u, u.MotDePasseHash, r.MotDePasseActuel) == PasswordVerificationResult.Failed)
            throw new DonneesInvalidesException("Le mot de passe actuel est incorrect.");

        u.MotDePasseHash = hacheur.HashPassword(u, r.NouveauMotDePasse);
        u.MotDePasseModifieLe = horloge.GetUtcNow().UtcDateTime; // déconnecte les autres appareils
        await db.SaveChangesAsync();
        cache.Remove(EtatCompte.Cle(u.Id));
    }

    public async Task DemanderReinitialisationAsync(MotDePasseOublieDto r, RoleUtilisateur role)
    {
        var email = NormaliserEmail(r.Email);
        var u = await db.Utilisateurs.FirstOrDefaultAsync(x => x.Email == email && x.Role == role && x.Actif);
        if (u is null) return; // même réponse que si le compte existe : on ne révèle pas les e-mails inscrits

        // Jeton aléatoire envoyé par e-mail ; seule son empreinte est gardée en base
        var jeton = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        u.JetonReinitialisationHash = Empreinte(jeton);
        u.ExpirationReinitialisation = horloge.GetUtcNow().UtcDateTime.AddHours(1);
        await db.SaveChangesAsync();

        var p = await parametres.ObtenirAsync();
        var site = role == RoleUtilisateur.SuperAdmin ? AdressesSites.SuperAdmin(configuration) : AdressesSites.Site(configuration);
        await emails.EnvoyerAsync(new EmailAEnvoyer(u.Email, $"{p.NomPlateforme} : réinitialisation de votre mot de passe",
            $"""
            Bonjour {u.NomComplet},

            Vous avez demandé à changer le mot de passe de votre compte {p.NomPlateforme}.
            Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 1 heure) :

            {site}/reinitialiser-mot-de-passe?jeton={jeton}

            Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.

            L'équipe {p.NomPlateforme}
            """));
    }

    public async Task<Utilisateur> ReinitialiserMotDePasseAsync(ReinitialisationMotDePasseDto r, RoleUtilisateur role)
    {
        var maintenant = horloge.GetUtcNow().UtcDateTime;
        var empreinte = Empreinte(r.Jeton.Trim());
        var u = await db.Utilisateurs.FirstOrDefaultAsync(x =>
                    x.JetonReinitialisationHash == empreinte && x.ExpirationReinitialisation > maintenant
                    && x.Actif && x.Role == role)
                ?? throw new DonneesInvalidesException("Ce lien n'est plus valable. Refaites une demande de mot de passe oublié.");

        u.MotDePasseHash = hacheur.HashPassword(u, r.NouveauMotDePasse);
        u.JetonReinitialisationHash = null; // le lien ne sert qu'une fois
        u.ExpirationReinitialisation = null;
        u.MotDePasseModifieLe = maintenant;
        u.DerniereConnexion = maintenant;
        notifications.Ajouter(u.Id, TypeNotification.Systeme, "Mot de passe modifié",
            "Votre mot de passe a été réinitialisé. Si ce n'est pas vous, contactez le support immédiatement.");
        await db.SaveChangesAsync();
        cache.Remove(EtatCompte.Cle(u.Id));
        return u;
    }

    private static string Empreinte(string jeton) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(jeton)));

    public Task<Utilisateur> CompteAsync() => db.Utilisateurs.AsNoTracking().FirstAsync(u => u.Id == moi.Id);

    private static string CompteValide(string saisie) =>
        Abonnements.NormaliserTelephone(saisie)
        ?? throw new DonneesInvalidesException("Numéro de réception des loyers invalide : saisissez un numéro Orange Money ou MTN MoMo du Cameroun (ex : 677 12 34 56).");

    public static string NormaliserEmail(string email) => email.Trim().ToLowerInvariant();
}
