# IMMO PILOT — Super admin

Application interne de l'équipe IMMO PILOT pour administrer la plateforme :
clients (bailleurs et agences), abonnements, utilisateurs, support et paramètres.

C'est un projet séparé du site public et de l'espace bailleur (dossier `../frontend`).

## Lancer le projet

```bash
npm install
npm run dev
```

L'application s'ouvre sur [http://localhost:3001](http://localhost:3001)
(le port 3001 évite le conflit avec le frontend, qui tourne sur le port 3000).

## Organisation

```
app/                      pages (/, /clients, /abonnements, /utilisateurs, /support, /parametres)
components/layout/        sidebar, barre du haut, menu (navigation.ts)
components/superadmin/    listes et données propres au super admin
components/ui/            boutons, champs, logo, graphique…
components/dashboard/     cartes de statistiques, filtres, sections de paramètres
```

## À faire avant la mise en ligne

- **Authentification** : l'application n'est pas encore protégée. Seuls les membres de l'équipe
  (rôle super admin) doivent pouvoir y accéder.
- **Données** : toutes les données sont des exemples (`components/superadmin/donnees.ts`).
  Les actions (suspendre, bloquer, répondre…) ne modifient que l'affichage : chaque endroit
  à brancher sur le backend est marqué `// TODO`.
