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
- `css/style.css` — feuille de styles unique, variables CSS en tête (`--orange-cuivre`, `--gris-texte`, `--spacing-*`, `--border-radius`, etc.). Respecter ces tokens plutôt que des valeurs en dur.
- `js/script.js` — petit script global (menu mobile, comportements UI, animations d'apparition au scroll, carrousel d'avis). Le menu mobile est aussi défini inline dans chaque page via `toggleMenu()`. Les animations au scroll pré-masquent uniquement les sections sous la ligne de flottaison (classes `.reveal-prep`/`.reveal-in`) : ne jamais masquer du contenu déjà visible, sinon ça « saute ».

### Photos & mises en page immersives
Les photos du cabinet vivent dans `images/` en **WebP ~1600px, qualité ~82** (`convert source.jpg -resize 1600x -quality 82 images/nom.webp`), avec `loading="lazy"` et un alt descriptif en français. Pas d'ombre portée sur les images. Deux motifs définis dans `css/style.css` :
- **`.section-duo`** (+ `.duo-inverse` pour mettre l'image à droite) : section moitié image / moitié texte. L'image est un `div.duo-image` avec `background-image` inline + `role="img"`/`aria-label` ; le texte va dans `div.duo-texte`. Utilisé pour les intros des pages prestations (alternance gauche/droite d'une page à l'autre), « Une approche holistique » sur l'accueil, l'intro et « Mon approche » sur À propos.
- **`.bandeau-photo`** : bandeau photo pleine largeur (65vh, 48vh mobile) avec voile sombre et citation en Playfair italique blanc (`<p>« … »</p>`). Le cadrage se règle au cas par cas via `background-position` inline (les photos 3:2 sont rognées verticalement : viser le sujet). Un bandeau par page prestation entre « Déroulement » et les tarifs, trois sur `massages.html`, un sur À propos (devise).

Le bandeau d'en-tête de `massages.html` utilise `hero-massages-cabinet.webp` (+ `.jpg` pour le fallback `.no-webp`), hauteur 72vh définie inline sur la section.

### Blog
Le blog est constitué de pages HTML statiques dans `blog/`, éditées à la main comme le reste du site. `blog/index.json` liste les articles (slug, titre, description, date) et doit être mis à jour à chaque ajout/suppression d'article, tout comme la page `blog/index.html`. Le header/footer des articles doit rester synchronisé avec ceux des autres pages.

### Avis Google
`avis.json` (racine) contient note globale, nombre total et derniers avis de la fiche Google Business Profile. Il est régénéré quotidiennement par la GitHub Action `.github/workflows/avis-google.yml` (API Google Places New ; secret `GOOGLE_PLACES_API_KEY` + variable `GOOGLE_PLACE_ID` requis) — ne pas l'éditer à la main. `index.html` le charge en JS pour afficher la section avis ; les cartes en dur dans le HTML servent de fallback sans JS.

### SEO
`sitemap.xml` et `robots.txt` sont maintenus à la main. Quand une page est ajoutée (racine, `massages/` ou `blog/`), l'ajouter au sitemap avec un `lastmod` correct ; mettre à jour le `lastmod` des pages modifiées de façon substantielle. La carte cadeau n'existe pas en page sur le site (pour empêcher l'impression sans paiement) : Delphine détient le PDF, et le site n'en montre qu'un aperçu basse résolution (`images/carte-cadeau-apercu.webp`). La feuille de route SEO/acquisition est dans `ROADMAP-SEO.md`.

## Conventions

- Toute la rédaction utilisateur est en **français**.
- Les commits récents suivent des préfixes courts `feat:`, `fix:`, `chore:` en français/anglais mixte, sujet concis, pas de corps.
- Les branches `main` et de prod sont identiques ; travailler directement sur `main` ou via PR, puis Vercel déploie.
