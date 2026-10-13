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

## Envoi d'e-mails de la plateforme (mot de passe oublié)

Les relances de loyer ne passent pas par ici : sur la page Loyers, les boutons « E-mail » et « WhatsApp »
ouvrent la messagerie ou le WhatsApp du propriétaire avec le message déjà écrit (il part de sa propre adresse).

Sans configuration, les e-mails ne partent pas : en développement, leur contenu (avec le lien
« mot de passe oublié ») n'est jamais journalisé. Pour les envoyer vraiment, par exemple avec Gmail
(créez d'abord un « mot de passe d'application » sur https://myaccount.google.com/apppasswords) :

```bash
dotnet user-secrets set "Email:Hote" "smtp.gmail.com"
dotnet user-secrets set "Email:Port" "587"
dotnet user-secrets set "Email:Utilisateur" "votre.adresse@gmail.com"
dotnet user-secrets set "Email:MotDePasse" "MOT_DE_PASSE_D_APPLICATION"
dotnet user-secrets set "Email:NomExpediteur" "IMMO PILOT"
```

En production, indiquez aussi les adresses publiques des deux interfaces : `Frontend:Url` pour les bailleurs et
`SuperAdmin:FrontendUrl` pour le super administrateur. Elles servent à construire les liens de réinitialisation.
Exemple de variables d''environnement : `Frontend__Url=https://immopilot.example.com` et
`SuperAdmin__FrontendUrl=https://admin.immopilot.example.com`.

Si l''API est derrière un reverse proxy (Nginx, Caddy, etc.), configurez son adresse IP de confiance pour que les
limites de tentatives d''authentification utilisent l''adresse réelle du client :
`ForwardedHeaders__KnownProxies__0=10.0.0.10`. N'ajoutez que les IP des proxies que vous contrôlez.

Après mise à jour du backend, appliquez les migrations depuis `backend/ImmoPilot.Api` avec
`dotnet ef database update`. La migration `CorrigePrixPro` remplace l''ancienne valeur de test de 25 FCFA par
15 000 FCFA, tout en conservant tout autre tarif déjà enregistré.

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

