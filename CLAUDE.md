# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Site vitrine statique de **Delphine Millot** (massages bien-être & Qi Gong, Brignoles, Var). Public francophone. Domaine : `delphine-millot.fr` (voir `CNAME`).

- **Stack** : HTML/CSS/JS vanilla, aucun build, aucun framework, aucun test.
- **Hébergement** : Vercel (`vercel.json` minimal, `"public": true`). Le site est déployé automatiquement sur push `main` via l'intégration GitHub ↔ Vercel.
- **Une seule API serverless** : `api/publish-article.js` (fonction Vercel Node).

## Workflow de développement

Pas de `package.json`, pas de build, pas de lint. Pour prévisualiser en local, ouvrir les fichiers HTML directement ou servir le dossier (`python -m http.server` / extension VS Code Live Server). La prod se met à jour en poussant sur `main`.

## Architecture

### Pages statiques
Toutes les pages de niveau racine (`index.html`, `massages.html`, `qi-gong.html`, `a-propos.html`, `mentions-legales.html`, `politique-confidentialite.html`) et les sous-pages (`massages/*.html`, `blog/*.html`) partagent **le même header/footer copiés-collés** dans chaque fichier. Il n'y a pas de système de templates : toute modification du menu, du sous-menu massages, du footer, ou de l'année du copyright doit être répercutée dans **chaque** fichier HTML concerné.

Les liens vers le CSS utilisent un cache-buster manuel : `/css/style.css?v=N`. Quand tu modifies `css/style.css` de manière visible, incrémente `v=` sur **toutes** les pages HTML (grep sur `style.css?v=` pour les trouver).

### Styles & JS
- `css/style.css` — feuille de styles unique (~1400 lignes), variables CSS en tête (`--orange-cuivre`, `--gris-texte`, `--spacing-*`, `--border-radius`, etc.). Respecter ces tokens plutôt que des valeurs en dur.
- `js/script.js` — petit script global (menu mobile, comportements UI). Le menu mobile est aussi défini inline dans chaque page via `toggleMenu()`.

### Blog & admin (flux de publication)
Le blog est **généré à la demande** côté serveur via `api/publish-article.js`, qui écrit directement dans ce même repo GitHub via l'API Contents :

1. `admin/index.html` — SPA minimaliste (auth locale, éditeur WYSIWYG) qui appelle l'API avec un `Bearer ${PUBLISH_SECRET}`.
2. `api/publish-article.js` — handler Vercel qui :
   - **GET `?action=list`** : lit `blog/index.json` et renvoie la liste triée.
   - **GET `?action=get&slug=...`** : lit `blog/{slug}.html` et extrait titre/description/date/intro/corps par **regex sur le HTML généré** (voir lignes 79-86). Le template HTML est le contrat : ne pas changer la structure sans mettre à jour les regex en cohérence.
   - **POST `action=delete`** : supprime `blog/{slug}.html` et met à jour `blog/index.json`.
   - **POST (publish/update)** : reconstruit entièrement `blog/{slug}.html` depuis le template inline (lignes 128-236) et met à jour `blog/index.json`. **Le header/footer dans ce template doit rester synchronisé avec ceux des autres pages.**

Variables d'environnement Vercel requises : `PUBLISH_SECRET`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN` (PAT avec accès écriture au repo).

### SEO
`sitemap.xml` et `robots.txt` sont maintenus à la main. Quand une nouvelle page est ajoutée à la racine ou dans `massages/`, l'ajouter au sitemap. Les articles de blog ne sont pas listés dans `sitemap.xml` (à vérifier avant toute campagne SEO).

## Conventions

- Toute la rédaction utilisateur est en **français**.
- Les commits récents suivent des préfixes courts `feat:`, `fix:`, `chore:` en français/anglais mixte, sujet concis, pas de corps.
- Les branches `main` et de prod sont identiques ; travailler directement sur `main` ou via PR, puis Vercel déploie.
