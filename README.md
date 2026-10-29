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
| `src/app/[lang]/admin/` | Page protégée (`ADMIN_PASSWORD`) : mes articles, commentaires à valider, membres, liens et flux RSS |
| `src/lib/posts/` | Articles rédigés sur le site (une version par langue, photo en base) |
| `src/lib/members/`, `src/lib/comments.ts` | Comptes des visiteurs (inscription, validation par e-mail, sessions) et commentaires |
| `src/app/[lang]/account/` | Inscription, connexion, mot de passe oublié, « Mon compte » |
| `src/proxy.ts` | Redirection vers la langue préférée |

Les appels aux sources de données (football-data.org pour les 5 grands championnats, Live-score API pour la Botola, voir `src/lib/competitions.ts`) sont mis en cache côté serveur (`"use cache"`) pour que le trafic des visiteurs ne consomme pas le quota.

## Articles

La page `/fr/articles` (et `/ar`, `/en`) affiche des cartes : titre, résumé court et image repris de la source, avec un lien vers l'article original. Le texte complet n'est jamais recopié.
Les articles viennent de deux endroits, mélangés du plus récent au plus ancien :

- les flux RSS enregistrés (4 par défaut, voir `defaultFeeds` dans `src/lib/articles/db.ts`) ;
- les liens collés à la main dans `/fr/admin`.

Chaque flux ou article a une langue ; une page n'affiche que les articles de sa langue.
Les tables sont créées automatiquement au premier accès à la base.

## Articles Maroc-Foot, comptes et commentaires

- `/fr/admin/articles` : écrire un article dans une, deux ou trois langues (un onglet par langue). Une langue sans titre n'affiche pas l'article dans cette langue. Les articles « À la une » s'affichent sur l'accueil (position 1 = en premier), tous les articles publiés en tête de la page Articles, chacun sur sa page `/fr/articles/12-titre`.
- Mise en forme : `## Titre`, `### Sous-titre`, `- liste`, `> citation`, `**gras**`, `*italique*`, `[texte](https://lien)`. Rien d'autre n'est interprété (pas de HTML).
- Les photos sont réduites dans le navigateur (1600 px de large) puis stockées dans Postgres, servies par `/api/media/<n>`.
- Les visiteurs créent un compte (e-mail, pseudo, mot de passe chiffré avec scrypt), le valident avec le lien reçu par e-mail, puis commentent. Chaque commentaire attend la validation dans `/fr/admin/comments` ; les membres peuvent signaler un commentaire publié. Un membre bloqué ne peut plus se connecter et ses commentaires disparaissent.
- E-mails envoyés avec Resend : `RESEND_API_KEY` (et `MAIL_FROM`, par défaut `Maroc-Foot <noreply@maroc-foot.com>`). Sans clé, les inscriptions sont fermées en production ; en local, le lien est écrit dans la console. `SITE_URL` (par défaut `https://maroc-foot.com`) sert à construire les liens des e-mails.

## Publicité (Google AdSense)

Les emplacements sont prêts mais restent invisibles tant que `ADSENSE_CLIENT` n'est pas renseigné (voir `.env.example` et `src/lib/ads.ts`) :

- `banner` : bandeau sous la barre des championnats, sur toutes les pages ;
- `inline` : bloc dans la page d'accueil, sous les onglets d'un championnat ou d'une coupe, et toutes les 6 cartes d'articles ;
- `sidebar` : colonne à droite sur les grands écrans (1280 px et plus).

La place de chaque annonce est réservée pour que la page ne saute pas au chargement. `/ads.txt` est généré à partir de `ADSENSE_CLIENT`.
`ADS_PREVIEW=1` affiche des cadres gris à la place des annonces pour vérifier la mise en page. Les variables sont lues au moment du déploiement : après les avoir changées sur Vercel, relancer un déploiement.

## Étapes suivantes

1. Choisir une source pour la Botola Pro (compte API-Football suspendu ; pistes : Live-score API, Statorium).
2. Service de synchronisation + base Postgres/Redis pour le direct.
3. Page « En direct ».
