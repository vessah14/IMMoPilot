# IMMO PILOT — Backend (API ASP.NET Core)

API REST du projet IMMO PILOT : immeubles, logements, locataires et paiements.
ASP.NET Core (.NET 10) + Entity Framework Core + PostgreSQL.

## Organisation

```
ImmoPilot.Api/
├── Models/        entités de la base (Immeuble, Logement, Locataire, Paiement) et enums
├── Data/          ImmoPilotDbContext (tables, relations, contraintes) + Migrations/
├── Dtos/          données reçues (…RequeteDto, avec validation) et renvoyées (…Dto) par l'API
├── Interfaces/    contrats des services (IImmeubleService…)
├── Services/      logique métier (règles de gestion, accès à la base)
├── Controllers/   routes HTTP /api/… : appellent les services et renvoient les codes HTTP
├── Exceptions/    erreurs métier → réponses 400 / 409
└── Program.cs     configuration : base, services, CORS, JSON, erreurs
```

Le chemin d'une requête : **Controller → Interface → Service → DbContext → PostgreSQL**.

## Première installation

1. **Mot de passe PostgreSQL** (stocké hors du code, dans les « user secrets » de votre machine) :

   ```bash
   cd ImmoPilot.Api
   dotnet user-secrets set "ConnectionStrings:ImmoPilot" "Host=localhost;Port=5432;Database=immopilot;Username=postgres;Password=VOTRE_MOT_DE_PASSE"
   ```

2. **Créer la base et les tables** :

   ```bash
   dotnet ef database update
   ```

3. **Lancer l'API** :

   ```bash
   dotnet run --launch-profile http
   ```

   L'API répond sur http://localhost:5065 (documentation : http://localhost:5065/openapi/v1.json).
   Le fichier `ImmoPilot.Api.http` contient des requêtes prêtes à tester.

## E-mails automatiques (via Brevo)

| Événement | Destinataire |
|---|---|
| Inscription | bailleur : bienvenue |
| Nouveau locataire, logement attribué, nouveau lien | locataire : son lien de paiement du loyer |
| Loyer enregistré par le bailleur (« Confirmé ») | locataire : reçu |
| Loyer payé en ligne | locataire : reçu · bailleur : « Loyer reçu » |
| Abonnement payé | bailleur : confirmation + n° de facture |
| Mot de passe oublié | bailleur : lien de réinitialisation |

Les e-mails partent en arrière-plan (une panne de Brevo ne bloque ni une inscription ni un paiement).
Pour un locataire, « Répondre » écrit directement au bailleur.
Les relances de loyer, elles, partent de la messagerie ou du WhatsApp du propriétaire (page Loyers).

Configuration Brevo (SMTP & API → onglet SMTP ; l'adresse d'envoi doit être validée dans Expéditeurs) :

```bash
dotnet user-secrets set "Email:Hote" "smtp-relay.brevo.com"
dotnet user-secrets set "Email:Port" "587"
dotnet user-secrets set "Email:Utilisateur" "xxxx@smtp-brevo.com"
dotnet user-secrets set "Email:MotDePasse" "xsmtpsib-…"   # clé SMTP, pas la clé API
dotnet user-secrets set "Email:Expediteur" "adresse.validee@exemple.com"
dotnet user-secrets set "Email:NomExpediteur" "IMMO PILOT"
```

Sans configuration, les e-mails ne partent pas : en développement, leur contenu s'affiche dans la console de l'API.
En production, indiquez l'adresse du site pour les liens : `Frontend:Url` (par défaut `http://localhost:3000`).

## Routes

| Méthode | Route | Filtres |
|---|---|---|
| GET, POST | `/api/immeubles` | `?ville=` |
| GET, PUT, DELETE | `/api/immeubles/{id}` | |
| GET, POST | `/api/logements` | `?immeubleId=&statut=Vacant\|Occupe\|Travaux` |
| GET, PUT, DELETE | `/api/logements/{id}` | |
| GET, POST | `/api/locataires` | `?recherche=` |
| GET, PUT, DELETE | `/api/locataires/{id}` | |
| GET, POST | `/api/paiements` | `?locataireId=&moyen=OrangeMoney\|MtnMomo\|Especes\|Virement&mois=2026-09-01` |
| GET, PUT, DELETE | `/api/paiements/{id}` | |

## Règles de gestion

- Un immeuble qui a encore des logements ne peut pas être supprimé (409).
- Une référence de logement est unique dans un immeuble (409).
- Attribuer un logement à un locataire le passe à « Occupe » ; il doit être « Vacant » (409 sinon).
  Changer de logement ou supprimer le locataire libère l'ancien.
- Un locataire qui a des paiements ne peut pas être supprimé : on libère son logement pour garder l'historique.
- La période d'un paiement est toujours ramenée au 1er du mois.

## Modifier la base

Après avoir changé un modèle ou le DbContext :

```bash
dotnet ef migrations add NomDuChangement -o Data/Migrations
dotnet ef database update
```

## Compte et sécurité

- `POST /api/auth/mot-de-passe-oublie` envoie un lien valable 1 heure, utilisable une seule fois
  (réponse identique que l'e-mail soit inscrit ou non).
- `POST /api/auth/reinitialisation` change le mot de passe avec ce lien et connecte directement.
- Après un changement de mot de passe, les sessions ouvertes sur les autres appareils sont refusées.

## À faire

- Relances par SMS (fournisseur à choisir) ; pour l'instant : e-mail et WhatsApp depuis les outils du propriétaire.

