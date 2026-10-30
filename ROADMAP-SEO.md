# Roadmap SEO & acquisition — delphine-millot.fr

Objectif : augmenter significativement le chiffre d'affaires (visibilité locale, réservations, récurrence).
Dernière mise à jour : 2026-10-30 (fin de journée — photos intégrées).

## Priorité 1 — Fiche Google Business Profile (GBP)

- [ ] Obtenir des avis Google en continu : demander après chaque séance (QR code vers le lien d'avis imprimé au cabinet). Objectif : 30-50 avis. **Point au 2026-10-29 : 24 avis, note 5,0 — en bonne voie.**
- [x] **Connecter le site à Google pour que les avis se synchronisent automatiquement entre le site et la fiche GBP** — côté site, c'est en place (2026-08-26) : la GitHub Action `.github/workflows/avis-google.yml` récupère chaque jour note globale + nombre total + 5 avis via l'API Google Places (New) et committe `avis.json`, que la page d'accueil affiche. Coût : ~30 appels/mois pour 1 000 gratuits (catégorie Enterprise + Atmosphere), donc 0 €.
  - [x] Clé API + Place ID configurés — le workflow tourne en production depuis octobre 2026 (commits quotidiens du bot quand les avis changent).
- [ ] Alimenter la fiche GBP : photos régulières (**les 23 photos pro du site sont prêtes à y être téléversées** — portrait de Delphine en photo de profil, déco bouddha en couverture), posts, Q&R, catégories secondaires (drainage lymphatique, Qi Gong…).

## Priorité 2 — Carte cadeau (saison Noël) ✅ dispositif en place

- [x] **Améliorer le design de la carte cadeau** — refonte validée le 2026-10-29. Décision du 2026-10-30 : pas de page carte cadeau sur le site (pour empêcher l'impression sans paiement) ; **Delphine détient le PDF** et le site ne montre qu'un aperçu basse résolution (`images/carte-cadeau-apercu.webp`).
- [x] Mettre la carte cadeau en avant pendant la saison : encart avec aperçu visuel + bouton de commande WhatsApp dans l'article de blog idée cadeau de Noël, et encart « Offrez un massage pour Noël » sur l'accueil juste sous le hero (2026-10-30).
- [ ] **Début janvier 2027 : retirer l'encart Noël de l'accueil** (commentaire repère « saisonnier » dans `index.html`) — ou le remplacer par une version Saint-Valentin (le massage duo s'y prête).

## Abandonné

- ~~Carte cadeau spéciale Noël~~ — décision du 2026-10-30 : une seule carte cadeau, la classique (PDF détenu par Delphine).
- ~~Massages à domicile~~ — Delphine ne souhaite pas proposer cette offre (décision 2026-10-29). Ne pas créer de page ni l'évoquer sur le site ou la fiche GBP.

## Priorité 3 — Réservation en ligne

- [ ] S'inscrire sur une plateforme de réservation (Resalib, Médoucine ou Planity) : réservations 24h/24, visibilité sur leur annuaire, backlink vers le site.
- [ ] Ajouter le bouton « Réserver en ligne » sur toutes les pages (header + sections contact).

## Priorité 4 — Contenu

- [ ] 1 à 2 articles de blog par mois. **Premier article saisonnier publié le 2026-10-29 : « Offrir un massage pour Noël »** (`blog/offrir-massage-noel-carte-cadeau-brignoles.html`). Prochaines pistes : Saint-Valentin (massage duo), réflexologie plantaire chinoise (nouveauté à faire connaître), massage anti-stress, Qi Gong débutant, jambes lourdes l'été (drainage).
- [ ] Tenir `blog/index.json`, `blog/index.html` et `sitemap.xml` à jour à chaque publication.

## Priorité 5 — Liens locaux (backlinks & citations)

- [ ] Annuaires : PagesJaunes, annuaire-therapeutes.com, plateforme de réservation choisie.
- [ ] Partenaires locaux : studios de yoga, salles de sport, hôtels/gîtes, office de tourisme de la Provence Verte, comités d'entreprise.
- [ ] Cohérence NAP (nom, adresse, téléphone identiques partout).

## Priorité 6 — Mesure

- [ ] Vérifier la propriété **Google Search Console** pour delphine-millot.fr, soumettre le sitemap, suivre les requêtes (viser les positions 5-15 à améliorer).
- [ ] Suivre chaque mois : appels/WhatsApp, réservations en ligne, avis Google, positions locales.

## Fait

- [x] 2026-10-30 — **Reportage photo intégré sur tout le site** : 23 photos professionnelles du cabinet (WebP optimisé, alt descriptifs). Vrai bandeau photo sur la page Massages, sections moitié image/moitié texte (`.section-duo`) pour les intros des pages prestations, l'accueil et À propos, bandeaux citation pleine largeur (`.bandeau-photo`, 65vh, voile sombre, cadrage réglé au cas par cas), articles de blog illustrés. À faire en miroir : téléverser les meilleures photos sur la fiche GBP (portrait en photo de profil, déco bouddha en couverture).
- [x] 2026-10-30 — Correction du saut visuel au scroll (sections pré-masquées seulement sous la ligne de flottaison).
- [x] 2026-10-30 — Dispositif de Noël complet : article idée cadeau publié (blog + sitemap + listing), refonte de la carte cadeau (PDF privé remis à Delphine, page outil supprimée du site), aperçu basse résolution dans l'article et encart saisonnier sur l'accueil.
- [x] Octobre 2026 — Synchronisation automatique des avis Google en production (workflow quotidien, note + nombre total + 5 avis affichés sur l'accueil).
- [x] 2026-08-26 — `lastmod` du sitemap mis à jour pour `a-propos.html` ; CLAUDE.md dépoussiéré (API blog supprimée).
- [x] (antérieur) — Base on-page solide : titres/descriptions localisés, JSON-LD complet (LocalBusiness, Services, FAQ, fil d'Ariane), canonicals, sitemap incluant le blog, images WebP avec alt.
