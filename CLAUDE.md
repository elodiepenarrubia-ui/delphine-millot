# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Site vitrine statique de **Delphine Millot** (massages bien-être & Qi Gong, Brignoles, Var). Public francophone. Domaine : `delphine-millot.fr` (voir `CNAME`).

- **Stack** : HTML/CSS/JS vanilla, aucun build, aucun framework, aucun test. Site 100 % statique (l'ancienne API `api/publish-article.js` et l'admin ont été supprimées).
- **Hébergement** : Vercel (`vercel.json` minimal, `"public": true`). Le site est déployé automatiquement sur push `main` via l'intégration GitHub ↔ Vercel.

## Workflow de développement

Pas de `package.json`, pas de build, pas de lint. Pour prévisualiser en local, ouvrir les fichiers HTML directement ou servir le dossier (`python -m http.server` / extension VS Code Live Server). La prod se met à jour en poussant sur `main`.

## Architecture

### Pages statiques
Toutes les pages de niveau racine (`index.html`, `massages.html`, `qi-gong.html`, `a-propos.html`, `mentions-legales.html`, `politique-confidentialite.html`) et les sous-pages (`massages/*.html`, `blog/*.html`) partagent **le même header/footer copiés-collés** dans chaque fichier. Il n'y a pas de système de templates : toute modification du menu, du sous-menu massages, du footer, ou de l'année du copyright doit être répercutée dans **chaque** fichier HTML concerné.

Les liens vers le CSS utilisent un cache-buster manuel : `/css/style.css?v=N`. Quand tu modifies `css/style.css` de manière visible, incrémente `v=` sur **toutes** les pages HTML (grep sur `style.css?v=` pour les trouver).

### Styles & JS
- `css/style.css` — feuille de styles unique (~1400 lignes), variables CSS en tête (`--orange-cuivre`, `--gris-texte`, `--spacing-*`, `--border-radius`, etc.). Respecter ces tokens plutôt que des valeurs en dur.
- `js/script.js` — petit script global (menu mobile, comportements UI). Le menu mobile est aussi défini inline dans chaque page via `toggleMenu()`.

### Blog
Le blog est constitué de pages HTML statiques dans `blog/`, éditées à la main comme le reste du site. `blog/index.json` liste les articles (slug, titre, description, date) et doit être mis à jour à chaque ajout/suppression d'article, tout comme la page `blog/index.html`. Le header/footer des articles doit rester synchronisé avec ceux des autres pages.

### Avis Google
`avis.json` (racine) contient note globale, nombre total et derniers avis de la fiche Google Business Profile. Il est régénéré quotidiennement par la GitHub Action `.github/workflows/avis-google.yml` (API Google Places New ; secret `GOOGLE_PLACES_API_KEY` + variable `GOOGLE_PLACE_ID` requis) — ne pas l'éditer à la main. `index.html` le charge en JS pour afficher la section avis ; les cartes en dur dans le HTML servent de fallback sans JS.

### SEO
`sitemap.xml` et `robots.txt` sont maintenus à la main. Quand une page est ajoutée (racine, `massages/` ou `blog/`), l'ajouter au sitemap avec un `lastmod` correct ; mettre à jour le `lastmod` des pages modifiées de façon substantielle. `carte-cadeau.html` est une page-outil d'impression en `noindex`, hors sitemap. La feuille de route SEO/acquisition est dans `ROADMAP-SEO.md`.

## Conventions

- Toute la rédaction utilisateur est en **français**.
- Les commits récents suivent des préfixes courts `feat:`, `fix:`, `chore:` en français/anglais mixte, sujet concis, pas de corps.
- Les branches `main` et de prod sont identiques ; travailler directement sur `main` ou via PR, puis Vercel déploie.
