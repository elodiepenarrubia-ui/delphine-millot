# Roadmap SEO & acquisition — delphine-millot.fr

Objectif : augmenter significativement le chiffre d'affaires (visibilité locale, réservations, récurrence).
Dernière mise à jour : 2026-08-26.

## Priorité 1 — Fiche Google Business Profile (GBP)

- [ ] Obtenir des avis Google en continu : demander après chaque séance (QR code vers le lien d'avis imprimé au cabinet). Objectif : 30-50 avis.
- [x] **Connecter le site à Google pour que les avis se synchronisent automatiquement entre le site et la fiche GBP** — côté site, c'est en place (2026-08-26) : la GitHub Action `.github/workflows/avis-google.yml` récupère chaque jour note globale + nombre total + 5 avis via l'API Google Places (New) et committe `avis.json`, que la page d'accueil affiche. Coût : ~30 appels/mois pour 1 000 gratuits (catégorie Enterprise + Atmosphere), donc 0 €.
  - [ ] **Reste à faire (une fois, ~15 min)** : créer un projet sur console.cloud.google.com, activer « Places API (New) », créer une clé API restreinte à cette API, puis dans GitHub → Settings → Secrets and variables → Actions : ajouter le secret `GOOGLE_PLACES_API_KEY` (la clé) et la variable `GOOGLE_PLACE_ID` (trouvable via le Place ID Finder de Google en cherchant « Delphine Millot Brignoles »). Enfin, lancer le workflow « Avis Google » à la main (onglet Actions → Run workflow) pour vérifier.
- [ ] Alimenter la fiche GBP : photos régulières, posts, Q&R, catégories secondaires (drainage lymphatique, Qi Gong…), et cocher le **service à domicile** avec la zone desservie.

## Priorité 2 — Massages à domicile (nouvelle offre à exploiter)

Delphine se déplace pour des massages **à domicile dans un rayon d'environ 45 minutes en voiture autour de Brignoles** (Provence Verte et alentours : Saint-Maximin-la-Sainte-Baume, Garéoult, Rocbaron, Forcalqueiret, Tourves, Le Val, La Celle, Camps-la-Source, Besse-sur-Issole, Flassans-sur-Issole, Le Luc, Carcès, Cotignac, Correns, Barjols…).

- [ ] Créer une page dédiée `massage-a-domicile.html` (conditions, zone desservie, éventuel supplément déplacement — à valider avec Delphine) et l'ajouter au menu, au sitemap et au maillage interne.
- [ ] Mentionner l'offre à domicile sur l'accueil et la page massages (+ FAQ).
- [ ] Mettre à jour le JSON-LD `LocalBusiness` : `areaServed` élargi (GeoCircle ~40 km autour de Brignoles) une fois la page en ligne.
- [ ] Décliner en articles de blog localisés (« massage à domicile à Saint-Maximin », etc.) — qualité avant quantité, éviter les pages-satellites vides.

## Priorité 3 — Réservation en ligne

- [ ] S'inscrire sur une plateforme de réservation (Resalib, Médoucine ou Planity) : réservations 24h/24, visibilité sur leur annuaire, backlink vers le site.
- [ ] Ajouter le bouton « Réserver en ligne » sur toutes les pages (header + sections contact).

## Priorité 4 — Contenu

- [ ] 1 à 2 articles de blog par mois. Pistes : idée cadeau massage (avant Noël, Saint-Valentin, fête des mères), jambes lourdes l'été (drainage), massage anti-stress, Qi Gong débutant, massages à domicile par ville.
- [ ] Tenir `blog/index.json`, `blog/index.html` et `sitemap.xml` à jour à chaque publication.

## Priorité 5 — Liens locaux (backlinks & citations)

- [ ] Annuaires : PagesJaunes, annuaire-therapeutes.com, plateforme de réservation choisie.
- [ ] Partenaires locaux : studios de yoga, salles de sport, hôtels/gîtes, office de tourisme de la Provence Verte, comités d'entreprise.
- [ ] Cohérence NAP (nom, adresse, téléphone identiques partout).

## Priorité 6 — Mesure

- [ ] Vérifier la propriété **Google Search Console** pour delphine-millot.fr, soumettre le sitemap, suivre les requêtes (viser les positions 5-15 à améliorer).
- [ ] Suivre chaque mois : appels/WhatsApp, réservations en ligne, avis Google, positions locales.

## Fait

- [x] 2026-08-26 — `noindex` sur `carte-cadeau.html` (page-outil d'impression).
- [x] 2026-08-26 — `lastmod` du sitemap mis à jour pour `a-propos.html` ; CLAUDE.md dépoussiéré (API blog supprimée).
- [x] (antérieur) — Base on-page solide : titres/descriptions localisés, JSON-LD complet (LocalBusiness, Services, FAQ, fil d'Ariane), canonicals, sitemap incluant le blog, images WebP avec alt.
