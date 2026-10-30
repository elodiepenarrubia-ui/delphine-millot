# Roadmap SEO & acquisition — delphine-millot.fr

Objectif : augmenter significativement le chiffre d'affaires (visibilité locale, réservations, récurrence).
Dernière mise à jour : 2026-10-29.

## Priorité 1 — Fiche Google Business Profile (GBP)

- [ ] Obtenir des avis Google en continu : demander après chaque séance (QR code vers le lien d'avis imprimé au cabinet). Objectif : 30-50 avis. **Point au 2026-10-29 : 24 avis, note 5,0 — en bonne voie.**
- [x] **Connecter le site à Google pour que les avis se synchronisent automatiquement entre le site et la fiche GBP** — côté site, c'est en place (2026-08-26) : la GitHub Action `.github/workflows/avis-google.yml` récupère chaque jour note globale + nombre total + 5 avis via l'API Google Places (New) et committe `avis.json`, que la page d'accueil affiche. Coût : ~30 appels/mois pour 1 000 gratuits (catégorie Enterprise + Atmosphere), donc 0 €.
  - [x] Clé API + Place ID configurés — le workflow tourne en production depuis octobre 2026 (commits quotidiens du bot quand les avis changent).
- [ ] Alimenter la fiche GBP : photos régulières, posts, Q&R, catégories secondaires (drainage lymphatique, Qi Gong…).

## Priorité 2 — Carte cadeau (saison Noël)

- [x] **Améliorer le design de `carte-cadeau.html`** — refonte le 2026-10-29 (photo pleine hauteur en biseau, titre Playfair + logo, champs pointillés, charte noir/blanc cassé/orange cuivré), validée. Reste un test d'impression réel en A5.
- [x] Mettre la carte cadeau en avant pendant la saison : encart « Découvrir la carte cadeau » ajouté dans l'article de blog idée cadeau de Noël (2026-10-30). Optionnel : encart saisonnier sur l'accueil.

## Abandonné

- ~~Carte cadeau spéciale Noël~~ — décision du 2026-10-30 : on garde une seule carte cadeau, la classique (`carte-cadeau.html`).
- ~~Massages à domicile~~ — Delphine ne souhaite pas proposer cette offre (décision 2026-10-29). Ne pas créer de page ni l'évoquer sur le site ou la fiche GBP.

## Priorité 3 — Réservation en ligne

- [ ] S'inscrire sur une plateforme de réservation (Resalib, Médoucine ou Planity) : réservations 24h/24, visibilité sur leur annuaire, backlink vers le site.
- [ ] Ajouter le bouton « Réserver en ligne » sur toutes les pages (header + sections contact).

## Priorité 4 — Contenu

- [ ] 1 à 2 articles de blog par mois. Pistes : idée cadeau massage (avant Noël, Saint-Valentin, fête des mères), jambes lourdes l'été (drainage), massage anti-stress, Qi Gong débutant, réflexologie plantaire chinoise.
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
