# Réservation en ligne — Spécification de conception

- **Date** : 2026-10-19
- **Statut** : conception validée (en attente de relecture finale avant plan d'implémentation)
- **Auteur** : Delphine Millot (décisions) + assistance technique
- **Périmètre** : ajout de la réservation en ligne avec paiement Stripe ou espèces sur place, pour 3 prestations.

---

## 1. Contexte & objectif

Le site `delphine-millot.fr` est aujourd'hui **100 % statique** (HTML/CSS/JS, hébergé sur Vercel, déployé au push `main`). Les boutons « Réserver » renvoient vers le téléphone.

Objectif : permettre la **réservation en ligne** des séances à l'unité pour **massage suédois**, **drainage lymphatique** et **réflexologie plantaire chinoise**, avec deux modes de règlement : **paiement en ligne (Stripe)** ou **espèces sur place**. L'agenda réel de Delphine (Google Agenda) reste la source de vérité.

Cette fonctionnalité réintroduit une **couche serveur** (fonctions serverless Vercel) : le site n'est plus purement statique.

## 2. Décisions clés (récapitulatif)

| Sujet | Décision |
|---|---|
| Approche | Sur mesure : fonctions serverless Vercel + Google Calendar API + Stripe Checkout |
| Source des disponibilités | Google Agenda, **fermé par défaut** (créneaux explicitement marqués « disponible ») |
| Horaires d'ouverture (plage externe) | Lundi–samedi, 9h–19h |
| Battement entre RDV | 30 min |
| Délais de réservation | Minimum 48h à l'avance, maximum 60 jours |
| Modèle de paiement | **Pas de paiement à la réservation.** Paiement intégral exigé en ligne ~48h avant. Payé → confirmé ; non payé à l'échéance → annulation auto ; payé puis annulé tard → non remboursé |
| Espèces | Conservé en option : réservation libre, paiement sur place, **sans** verrou à 48h |
| Montant en ligne | Séance entière (70 € / 105 €) |
| Mécanisme de paiement | **Lien de paiement Stripe** envoyé par email ~48–72h avant (aucune carte stockée) |
| Annulation / report | Self-service par lien email. Libre si > 48h ; après paiement (< 48h) : ni remboursement ni report |
| Canaux client | Email seul (V1) |
| Notification Delphine | Événement Google Agenda + email récap |
| Questionnaire santé | Non (champ « message » optionnel, non sensible) |
| CGV | Brouillon rédigé, à faire valider ; page dédiée + case à cocher |
| Données client | Minimum : nom, email, téléphone (+ message optionnel) |
| Intégration | Page dédiée `/reservation.html` ; boutons des pages massage pointent dessus ; téléphone conservé |
| Stockage | Supabase (PostgreSQL) |
| Emails transactionnels | Resend |

## 3. Périmètre

**Dans la V1 :**
- Séances à l'unité : suédois (1h / 1h30), drainage (1h / 1h30), réflexologie (1h).
- 1 praticienne, 1 lieu (pas de ressources multiples).
- Paiement en ligne **ou** espèces.
- Emails transactionnels.
- Annulation / report self-service.

**Hors V1 (à envisager plus tard) :**
- Vente des **forfaits 5 séances** en ligne.
- **SMS** (rappels, lien de paiement).
- Comptes clients / historique.
- Massage 4 mains & duo, Qi Gong, massage thérapeutique/tantrique.
- Acompte partiel, empreinte de carte, listes d'attente.

## 4. Prestations & tarifs (réservables)

| Prestation | Durées | Tarifs |
|---|---|---|
| Massage suédois | 1h / 1h30 | 70 € / 105 € |
| Drainage lymphatique | 1h / 1h30 | 70 € / 105 € |
| Réflexologie plantaire chinoise | 1h | 70 € |

Delphine est en **franchise de TVA (micro-entreprise)** — prix nets, mention « TVA non applicable, art. 293 B du CGI » sur les reçus.

## 5. Architecture technique

### Composants
- **Frontend statique** : nouvelle page `/reservation.html` (parcours : prestation → durée → créneau → coordonnées → récap). JS vanilla, charte du site.
- **Fonctions serverless Vercel** (`/api/*`) :
  - `GET /api/disponibilites` — calcule les créneaux libres.
  - `POST /api/reservations` — crée une réservation (tient le créneau, crée l'événement provisoire, envoie l'email de confirmation ; mode espèces → confirmé directement).
  - `POST /api/paiement/[token]` — crée une Stripe Checkout Session et redirige (cible du lien de paiement).
  - `POST /api/stripe/webhook` — à `checkout.session.completed` : marque payé, confirme, met l'événement à jour.
  - `GET|POST /api/reservations/[token]/annuler` et `/reporter` — self-service.
  - `GET /api/cron` — tâche planifiée (voir §9), protégée par secret.
- **Google Calendar API** via **compte de service** (JSON de clé en secret). Deux agendas :
  - *Disponibilités* : plages marquées « disponible » par Delphine (lecture).
  - *RDV* : agenda principal où sont écrits les événements de réservation (lecture + écriture). Peut être le même agenda si on distingue par un préfixe/couleur.
- **Stripe** : Checkout Sessions dynamiques + webhook signé.
- **Supabase (PostgreSQL)** : table `reservations` (état, jetons, références Stripe/Google).
- **Resend** : emails transactionnels (domaine `delphine-millot.fr` vérifié SPF/DKIM).
- **Vercel Cron** : déclenche `/api/cron` toutes les heures.

### Flux (vue d'ensemble)
```
Client ─▶ /reservation.html ─▶ /api/disponibilites ─▶ (Google: Dispo − RDV − battement)
      └─▶ /api/reservations ─▶ Supabase(en_attente) + Google(event provisoire) + Resend(confirmation)
Cron (horaire) ─▶ envoi lien paiement (T‑72h→T‑48h) ─▶ Resend
              └▶ annulation auto si non payé à T‑48h ─▶ Google(delete) + Resend
              └▶ rappel la veille ─▶ Resend
Client ─▶ lien paiement ─▶ /api/paiement ─▶ Stripe Checkout ─▶ webhook ─▶ Supabase(confirmé,payé) + Google(confirme)
```

## 6. Modèle de données (Supabase — table `reservations`)

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `created_at` | timestamptz | |
| `prestation` | text | `suedois` / `drainage` / `reflexologie` |
| `duree_min` | int | 60 ou 90 |
| `prix_eur` | int | 70 / 105 |
| `debut`, `fin` | timestamptz | créneau du RDV |
| `client_nom`, `client_email`, `client_tel` | text | |
| `message` | text null | champ libre optionnel |
| `mode_paiement` | text | `online` / `especes` |
| `statut` | text | `en_attente` / `confirme` / `annule` |
| `paye` | bool | |
| `stripe_session_id`, `stripe_payment_intent` | text null | |
| `google_event_id` | text null | événement agenda |
| `cancel_token` | uuid | lien self-service (unique, non devinable) |
| `payment_link_sent_at`, `reminder_sent_at` | timestamptz null | anti-doublon cron |
| `cgv_accepted_at` | timestamptz | consentement |
| `annule_par` | text null | `client` / `auto` / `delphine` |
| `updated_at` | timestamptz | |

Accès uniquement via la **clé service role** côté serveur (jamais exposée au client).

## 7. Disponibilités (algorithme, « fermé par défaut »)

Pour une prestation + durée demandées, sur `[from, to]` (borné à 48h–60j) :
1. Lire les plages **« disponible »** de l'agenda *Disponibilités*.
2. Lire les **événements existants** (RDV + indispos) de l'agenda *RDV*.
3. Intersecter les plages dispo avec la fenêtre **lun–sam 9h–19h**.
4. Soustraire les événements existants **+ 30 min de battement** avant/après.
5. Découper en créneaux de départ possibles (granularité 30 min par défaut) pouvant contenir la durée demandée.
6. Exclure tout créneau commençant à moins de 48h.

Le calcul se fait **côté serveur** à chaque requête (pas de cache en V1) pour refléter l'agenda en temps réel.

## 8. Parcours client

**En ligne :**
1. Choisit prestation, durée, créneau libre ; saisit nom/email/tél (+ message) ; coche les CGV.
2. `POST /api/reservations` → statut `en_attente`, créneau bloqué (événement provisoire « (en attente) »), email de confirmation expliquant que le paiement sera demandé ~48h avant.
3. Cron envoie le **lien de paiement** dans la fenêtre T‑72h → T‑48h (ou immédiatement si la résa est faite dans cette fenêtre).
4. Le client paie via Stripe Checkout → webhook → statut `confirme`, `paye = true`, événement mis à jour (« confirmé »).
5. S'il ne paie pas avant **T‑48h** → statut `annule` (auto), événement supprimé, email d'annulation.

**Espèces :** étapes 1–2 identiques, `mode_paiement = especes`, statut `confirme` d'emblée, pas de lien de paiement, pas d'annulation auto. Rappel la veille. Règlement sur place.

## 9. Cycle de vie & tâche planifiée (Cron horaire)

États : `en_attente` → `confirme` | `annule`. (Espèces : `confirme` dès la création.)

À chaque exécution, `/api/cron` :
- **Envoi des liens de paiement** : résa `online` + `en_attente` + `payment_link_sent_at` nul + `debut` dans ≤ 72h → envoie le lien, horodate.
- **Annulation auto** : résa `online` + `en_attente` + non payée + `debut` dans < 48h → `annule` (`annule_par = auto`), supprime l'événement, email.
- **Rappels** : résa `confirme` + `reminder_sent_at` nul + `debut` dans ~24h → email de rappel, horodate.

> **Détail à confirmer à l'implémentation** : pour une résa faite entre T‑48h et T‑72h, le lien est envoyé immédiatement et l'échéance de paiement reste T‑48h (fenêtre de paiement courte). Minimum de 48h à l'avance garanti par le calcul des disponibilités.

## 10. Paiement (Stripe)

- **Checkout Session** créée dynamiquement, montant = prix de la prestation, métadonnée = `reservation.id`.
- **Webhook** `checkout.session.completed` (signé via `STRIPE_WEBHOOK_SECRET`) → confirme la résa. Idempotent (une session = une résa).
- **Remboursement** : si Delphine annule un RDV payé → remboursement intégral via l'API Stripe. (Annulation tardive par le client → pas de remboursement.)
- Les **frais Stripe** sont à la charge de Delphine (le surcoût carte ne peut pas être refacturé au client en France) ; prix inchangés.
- Reçu Stripe envoyé automatiquement au client.

## 11. Annulation / report

- Lien **« annuler / reporter »** (jeton `cancel_token`) dans chaque email.
- **> 48h** : annulation ou report libres → libère/replace le créneau, met l'agenda à jour, email de confirmation. (Rien n'a été payé.)
- **< 48h** (donc payé) : **pas de remboursement, pas de report** ; message explicatif.
- **Annulation par Delphine** (directement dans l'agenda ou via un accès admin minimal) : remboursement intégral si payé + email au client. *(Mécanisme d'annulation côté Delphine à préciser : détection via l'agenda ou page admin légère — à trancher au plan d'implémentation.)*

## 12. Notifications (Resend, email seul en V1)

**Au client :** confirmation de réservation ; lien de paiement ; rappel la veille ; avis d'annulation (auto, ou par Delphine). 
**À Delphine :** email récap à chaque réservation et annulation + l'événement dans son agenda (nom, prestation, durée, tél, mode de paiement, statut). 
Expéditeur : adresse `@delphine-millot.fr` (domaine vérifié chez Resend).

## 13. Pages & UX

- **`/reservation.html`** : parcours en étapes, charte du site, responsive, accessible. Header/footer synchronisés (skill `sync-header-footer`), favicon, cache-buster CSS.
- Boutons « Réserver » des pages `massage-suedois`, `drainage-lymphatique`, `reflexologie-plantaire-chinoise` → `/reservation.html?prestation=...` (présélection).
- **Téléphone conservé** partout en alternative.
- **`/cgv.html`** : CGV + politique d'annulation ; liens au footer de toutes les pages.
- Mise à jour `sitemap.xml` (ajout `/reservation.html`, `/cgv.html`), `robots.txt` si besoin.

## 14. Légal & RGPD

- **CGV + politique d'annulation** : brouillon à rédiger (règle des 48h, non-remboursement, modalités). Point à faire valider par un professionnel : la **vente de prestations de services à date déterminée** peut être exclue du droit de rétractation (art. L221-28 du Code de la consommation) — à confirmer et à mentionner.
- **Case à cocher** d'acceptation des CGV obligatoire (horodatée : `cgv_accepted_at`).
- **Pas de données de santé** collectées (champ message libre non sensible ; mention invitant à ne pas y mettre d'info de santé).
- **politique-confidentialite.html** à compléter : finalité (gestion des réservations), base légale (exécution du contrat / consentement), **sous-traitants** (Vercel, Supabase, Stripe, Google, Resend), durées de conservation, droits RGPD.
- **Mentions légales** : identité du professionnel, médiateur de la consommation (obligatoire pour la vente en ligne au consommateur).

## 15. Configuration requise (à fournir par Delphine)

- **Stripe** : compte activé + coordonnées bancaires ; clés API (test + live) ; endpoint webhook.
- **Google** : projet Google Cloud (réutilisable depuis celui des avis), **compte de service**, agenda(s) partagé(s) avec lui en écriture ; création d'un agenda « Disponibilités ».
- **Supabase** : projet + clé service role + URL.
- **Resend** : compte + vérification du domaine `delphine-millot.fr` (SPF/DKIM).
- **Vercel** : secrets (toutes les clés ci-dessus) + activation de Vercel Cron.

Secrets (noms indicatifs) : `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_CAL_RDV_ID`, `GOOGLE_CAL_DISPO_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `BASE_URL`.

## 16. Points de vigilance / risques

- **Créneau bloqué longtemps sans paiement** : une résa en ligne tient le créneau jusqu'à son annulation auto (T‑48h) ; un flake tardif libère tard. Mitigations possibles (hors V1) : double opt-in email, limite de résa en attente par email.
- **Choix systématique des espèces** pour éviter de prépayer (compromis assumé).
- **Webhook Stripe & cohérence agenda↔paiement↔BDD** : zone la plus sensible ; prévoir idempotence, retries et réconciliation.
- **Fuseaux horaires** : tout en `Europe/Paris`, stockage en UTC.
- **Concurrence** : deux clients visant le même créneau — verrou applicatif à la création (vérifier la dispo juste avant d'écrire l'événement).
- **Fenêtre de paiement courte** pour les résa faites entre T‑48h et T‑72h.
- **SCA** : paiement **on-session** (le client clique et paie) → pas de problème d'authentification différée.

## 17. Critères d'acceptation (V1)

1. Un client peut réserver un créneau libre pour l'une des 3 prestations ; le créneau disparaît aussitôt des disponibilités.
2. Réservation en ligne : email de confirmation reçu ; lien de paiement reçu ~48–72h avant ; paiement → RDV confirmé dans l'agenda de Delphine.
3. Réservation en ligne non payée à T‑48h : annulée automatiquement, créneau libéré, client prévenu.
4. Réservation espèces : confirmée immédiatement, sans demande de paiement.
5. Annulation/report self-service : fonctionne > 48h ; bloqué < 48h après paiement.
6. Delphine reçoit un email + voit l'événement à chaque réservation/annulation.
7. CGV affichées et acceptées avant toute réservation.
8. Aucune clé secrète exposée côté client ; webhook Stripe vérifié.
