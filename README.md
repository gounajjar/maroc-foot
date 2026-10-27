# Maroc-Foot

Site de football : résultats en direct, classements et calendriers, en français, arabe et anglais.
Championnats au lancement : Botola Pro, Premier League, LaLiga, Serie A, Bundesliga, Ligue 1.

## Démarrer

```bash
cp .env.example .env.local   # puis renseigner FOOTBALL_DATA_KEY (et LIVESCORE_API_KEY / LIVESCORE_API_SECRET pour la Botola)
npm install
npm run dev
```

Le site s'ouvre sur http://localhost:3000 et redirige vers `/fr`, `/ar` ou `/en` selon la langue du navigateur.
Sans clé API, les pages s'affichent avec un message « clé non configurée ».

## Organisation

| Dossier | Rôle |
| --- | --- |
| `src/app/[lang]/` | Pages, une arborescence par langue (`ar` en sens droite à gauche) |
| `src/dictionaries/` | Textes de l'interface en `fr`, `ar`, `en` |
| `src/lib/competitions.ts` | Liste des championnats ; en ajouter un = une entrée de plus |
| `src/lib/football/` | Accès aux données. `types.ts` définit un format neutre, `football-data.ts` et `live-score.ts` l'adaptent à chaque source |
| `src/lib/articles/` | Articles externes : flux RSS (`rss.ts`), lecture des aperçus Open Graph (`open-graph.ts`), stockage Postgres (`db.ts`) |
| `src/app/[lang]/admin/` | Page protégée (`ADMIN_PASSWORD`) pour ajouter un article par son lien ou un flux RSS |
| `src/proxy.ts` | Redirection vers la langue préférée |

Les appels aux sources de données (football-data.org pour les 5 grands championnats, Live-score API pour la Botola, voir `src/lib/competitions.ts`) sont mis en cache côté serveur (`"use cache"`) pour que le trafic des visiteurs ne consomme pas le quota.

## Articles

La page `/fr/articles` (et `/ar`, `/en`) affiche des cartes : titre, résumé court et image repris de la source, avec un lien vers l'article original. Le texte complet n'est jamais recopié.
Les articles viennent de deux endroits, mélangés du plus récent au plus ancien :

- les flux RSS enregistrés (4 par défaut, voir `defaultFeeds` dans `src/lib/articles/db.ts`) ;
- les liens collés à la main dans `/fr/admin`.

Chaque flux ou article a une langue ; une page n'affiche que les articles de sa langue (ou tous, s'il n'y en a aucun).
Les tables sont créées automatiquement au premier accès à la base.

## Étapes suivantes

1. Choisir une source pour la Botola Pro (compte API-Football suspendu ; pistes : Live-score API, Statorium).
2. Service de synchronisation + base Postgres/Redis pour le direct.
3. Page « En direct ».
