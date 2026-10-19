# Réservation en ligne — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la réservation en ligne (3 prestations) avec paiement Stripe ou espèces, l'agenda Google comme source de vérité, et les automatisations (lien de paiement à 48h, annulation auto, rappels).

**Architecture:** Site statique inchangé + fonctions serverless Vercel sous `/api`. Google Agenda = disponibilités & RDV ; Supabase = état des réservations ; Stripe Checkout = paiement ; Resend = emails ; Vercel Cron = minuteur horaire. Le calcul des créneaux est une **fonction pure** isolée du reste (testable sans dépendance externe).

**Tech Stack:** Node.js (ESM) serverless functions, `googleapis`, `stripe`, `@supabase/supabase-js`, `resend`, Vitest (tests), JS vanilla côté client.

**Spec de référence :** `docs/superpowers/specs/2026-10-19-reservation-en-ligne-design.md`

---

## Feuille de route des phases

| Phase | Livrable | Statut du plan |
|---|---|---|
| **0** | Prérequis (comptes) + scaffolding (`package.json`, Vitest, structure, schéma Supabase) | **détaillé ci-dessous** |
| **1** | Moteur de disponibilités (fonction pure TDD) + endpoint `/api/disponibilites` + affichage des créneaux sur `/reservation.html` | **détaillé ci-dessous** |
| **2** | Création de réservation (hold + événement agenda + email confirmation ; flux espèces complet) | roadmap — à étoffer juste-à-temps |
| **3** | Paiement Stripe Checkout + webhook (flux en ligne jusqu'à « confirmé ») | roadmap |
| **4** | Vercel Cron : envoi lien de paiement, annulation auto, rappels | roadmap |
| **5** | Annulation / report self-service par lien email | roadmap |
| **6** | Pages légales (CGV, maj confidentialité), intégration site (boutons, sitemap, header/footer) | roadmap |

Chaque phase suivante sera convertie en tâches « bite-sized » (comme les phases 0–1) au moment de l'attaquer, une fois les comptes de la Phase 0 configurés.

---

## Structure de fichiers (cible)

```
package.json                      # deps + scripts (nouveau)
vitest.config.js                  # config tests (nouveau)
/lib
  disponibilites.js               # FONCTION PURE : calcul des créneaux libres
  prestations.js                  # catalogue prestations/durées/prix (source unique)
  google-calendar.js              # adaptateur Google (lecture dispo + RDV, écriture événements)
  supabase.js                     # client Supabase (service role)
  resend.js                       # envoi d'emails + templates
  stripe.js                       # création Checkout Session, remboursement
/api
  disponibilites.js               # GET créneaux libres
  reservations.js                 # POST créer une réservation
  paiement/[token].js             # POST crée la Checkout Session et redirige
  stripe/webhook.js               # POST webhook Stripe
  reservations/[token]/annuler.js # GET/POST annulation self-service
  reservations/[token]/reporter.js# GET/POST report self-service
  cron.js                         # GET tâche planifiée (protégée par secret)
/tests
  disponibilites.test.js
  prestations.test.js
reservation.html                  # page de réservation (nouveau)
cgv.html                          # CGV + politique d'annulation (nouveau)
supabase/migrations/0001_reservations.sql  # schéma (nouveau)
```

Principe : la logique métier testable vit dans `/lib` (fonctions pures ou adaptateurs fins) ; les fichiers `/api` sont de minces contrôleurs qui orchestrent `/lib`.

---

## Phase 0 — Prérequis & scaffolding

### Tâche 0.1 : Prérequis externes (actions de Delphine — hors code)

> Ces éléments doivent exister avant que les phases 1+ soient exécutables/testables de bout en bout. Le calcul pur de la Phase 1 est testable **sans** eux.

- [ ] **Stripe** : créer le compte, activer le mode test, récupérer `STRIPE_SECRET_KEY` (test) ; le webhook sera créé en Phase 3.
- [ ] **Supabase** : créer un projet ; noter `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **Resend** : créer le compte ; démarrer la vérification du domaine `delphine-millot.fr` (SPF/DKIM) ; noter `RESEND_API_KEY` ; définir une adresse `EMAIL_FROM` (ex. `reservation@delphine-millot.fr`).
- [ ] **Google** : dans le projet Google Cloud (réutiliser celui des avis), créer un **compte de service** + une clé JSON ; activer l'API Google Calendar ; créer un agenda **« Disponibilités »** ; **partager** cet agenda ET l'agenda des RDV avec l'email du compte de service en droit « Apporter des modifications aux événements » ; noter les deux `calendarId`.
- [ ] Rassembler les secrets ; ils seront mis dans Vercel (Phase où chaque service est branché) et dans un `.env.local` pour le dev.

### Tâche 0.2 : Initialiser `package.json` + Vitest

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `.gitignore` (ou modifier si présent)
- Create: `.env.example`

- [ ] **Step 1 : Créer `package.json`**

```json
{
  "name": "delphine-millot-reservation",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "googleapis": "^144",
    "resend": "^4",
    "stripe": "^17"
  },
  "devDependencies": {
    "vitest": "^2"
  }
}
```

- [ ] **Step 2 : Créer `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Step 3 : Créer `.env.example`** (documente les secrets, aucune valeur réelle)

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=reservation@delphine-millot.fr
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_CAL_RDV_ID=
GOOGLE_CAL_DISPO_ID=
CRON_SECRET=
BASE_URL=https://delphine-millot.fr
```

- [ ] **Step 4 : Mettre à jour `.gitignore`**

S'assurer qu'il contient :
```
node_modules/
.env.local
.vercel
```

- [ ] **Step 5 : Installer et vérifier**

Run: `npm install && npx vitest run`
Expected: installation OK ; Vitest démarre et signale « No test files found » (ou 0 test) sans erreur.

- [ ] **Step 6 : Commit**

```bash
git add package.json vitest.config.js .env.example .gitignore package-lock.json
git commit -m "chore: scaffolding réservation (package.json, vitest, env)"
```

### Tâche 0.3 : Schéma Supabase

**Files:**
- Create: `supabase/migrations/0001_reservations.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  prestation text not null check (prestation in ('suedois','drainage','reflexologie')),
  duree_min int not null check (duree_min in (60,90)),
  prix_eur int not null,
  debut timestamptz not null,
  fin timestamptz not null,
  client_nom text not null,
  client_email text not null,
  client_tel text not null,
  message text,
  mode_paiement text not null check (mode_paiement in ('online','especes')),
  statut text not null default 'en_attente' check (statut in ('en_attente','confirme','annule')),
  paye boolean not null default false,
  stripe_session_id text,
  stripe_payment_intent text,
  google_event_id text,
  cancel_token uuid not null default gen_random_uuid(),
  payment_link_sent_at timestamptz,
  reminder_sent_at timestamptz,
  cgv_accepted_at timestamptz not null,
  annule_par text check (annule_par in ('client','auto','delphine'))
);

create unique index if not exists reservations_cancel_token_idx on reservations (cancel_token);
create index if not exists reservations_statut_debut_idx on reservations (statut, debut);
```

- [ ] **Step 2 : Appliquer la migration** (via l'outil Supabase ou le SQL editor) et vérifier que la table existe.

Expected: table `reservations` créée, index présents.

- [ ] **Step 3 : Commit**

```bash
git add supabase/migrations/0001_reservations.sql
git commit -m "feat: schéma Supabase table reservations"
```

---

## Phase 1 — Moteur de disponibilités

### Tâche 1.1 : Catalogue des prestations (source unique)

**Files:**
- Create: `lib/prestations.js`
- Test: `tests/prestations.test.js`

- [ ] **Step 1 : Écrire le test (échec)**

```js
import { describe, it, expect } from 'vitest';
import { PRESTATIONS, getPrestation } from '../lib/prestations.js';

describe('prestations', () => {
  it('expose les 3 prestations réservables', () => {
    expect(Object.keys(PRESTATIONS).sort()).toEqual(['drainage','reflexologie','suedois']);
  });

  it('donne durées et prix du suédois', () => {
    const p = getPrestation('suedois');
    expect(p.durees).toEqual([
      { min: 60, prix: 70 },
      { min: 90, prix: 105 },
    ]);
  });

  it('la réflexologie n\'a qu\'une durée 1h à 70€', () => {
    expect(getPrestation('reflexologie').durees).toEqual([{ min: 60, prix: 70 }]);
  });

  it('renvoie null pour une prestation inconnue', () => {
    expect(getPrestation('qigong')).toBeNull();
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run tests/prestations.test.js`
Expected: FAIL (`lib/prestations.js` introuvable).

- [ ] **Step 3 : Implémenter**

```js
export const PRESTATIONS = {
  suedois: {
    slug: 'suedois',
    nom: 'Massage suédois',
    durees: [
      { min: 60, prix: 70 },
      { min: 90, prix: 105 },
    ],
  },
  drainage: {
    slug: 'drainage',
    nom: 'Drainage lymphatique',
    durees: [
      { min: 60, prix: 70 },
      { min: 90, prix: 105 },
    ],
  },
  reflexologie: {
    slug: 'reflexologie',
    nom: 'Réflexologie plantaire chinoise',
    durees: [{ min: 60, prix: 70 }],
  },
};

export function getPrestation(slug) {
  return PRESTATIONS[slug] ?? null;
}
```

- [ ] **Step 4 : Lancer → succès**

Run: `npx vitest run tests/prestations.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5 : Commit**

```bash
git add lib/prestations.js tests/prestations.test.js
git commit -m "feat: catalogue des prestations réservables"
```

### Tâche 1.2 : Fonction pure de calcul des créneaux

Cœur du système. Entrées : plages « disponible », événements occupés, paramètres (durée, battement, bornes, granularité). Sortie : liste de créneaux de départ possibles. **Tout en millisecondes UTC** ; la conversion fuseau se fait en amont (Phase 2/endpoint).

**Files:**
- Create: `lib/disponibilites.js`
- Test: `tests/disponibilites.test.js`

- [ ] **Step 1 : Écrire les tests (échec)**

```js
import { describe, it, expect } from 'vitest';
import { creneauxLibres } from '../lib/disponibilites.js';

// Helpers : dates ISO -> ms
const t = (iso) => new Date(iso).getTime();
const H = 60 * 60 * 1000;

describe('creneauxLibres', () => {
  const base = {
    dureeMin: 60,
    battementMin: 30,
    granulariteMin: 30,
    minLeadMs: 0,          // on neutralise le délai mini dans ces tests
    maintenant: t('2026-11-01T00:00:00Z'),
  };

  it('découpe une plage dispo vide en créneaux de 60 min tous les 30 min', () => {
    const dispo = [{ debut: t('2026-11-10T09:00:00Z'), fin: t('2026-11-10T11:00:00Z') }];
    const res = creneauxLibres({ ...base, dispo, occupe: [] });
    expect(res).toEqual([
      t('2026-11-10T09:00:00Z'),
      t('2026-11-10T09:30:00Z'),
      t('2026-11-10T10:00:00Z'),
    ]);
  });

  it('retire les créneaux en conflit avec un événement + battement de 30 min', () => {
    const dispo = [{ debut: t('2026-11-10T09:00:00Z'), fin: t('2026-11-10T13:00:00Z') }];
    const occupe = [{ debut: t('2026-11-10T11:00:00Z'), fin: t('2026-11-10T12:00:00Z') }];
    const res = creneauxLibres({ ...base, dispo, occupe });
    // Un créneau 60 min + 30 min de battement ne doit pas chevaucher 10:30–12:30
    expect(res).toContain(t('2026-11-10T09:00:00Z'));
    expect(res).toContain(t('2026-11-10T09:30:00Z'));
    expect(res).not.toContain(t('2026-11-10T10:00:00Z')); // finirait 11:00, battement jusqu'à 11:30 > début occupé 11:00
    expect(res).not.toContain(t('2026-11-10T11:00:00Z'));
    expect(res).toContain(t('2026-11-10T12:30:00Z')); // reprise après 12:00 + 30 min battement
  });

  it('respecte une durée de 90 min', () => {
    const dispo = [{ debut: t('2026-11-10T09:00:00Z'), fin: t('2026-11-10T11:00:00Z') }];
    const res = creneauxLibres({ ...base, dureeMin: 90, dispo, occupe: [] });
    expect(res).toEqual([t('2026-11-10T09:00:00Z'), t('2026-11-10T09:30:00Z')]);
  });

  it('exclut les créneaux avant le délai minimum', () => {
    const dispo = [{ debut: t('2026-11-01T08:00:00Z'), fin: t('2026-11-01T12:00:00Z') }];
    const res = creneauxLibres({
      ...base,
      dispo,
      occupe: [],
      minLeadMs: 48 * H,
      maintenant: t('2026-11-01T00:00:00Z'), // 48h après = 2026-11-03, donc tout le 01/11 est exclu
    });
    expect(res).toEqual([]);
  });

  it('fusionne/ignore les plages dispo qui se chevauchent sans dédoubler les créneaux', () => {
    const dispo = [
      { debut: t('2026-11-10T09:00:00Z'), fin: t('2026-11-10T10:00:00Z') },
      { debut: t('2026-11-10T09:30:00Z'), fin: t('2026-11-10T11:00:00Z') },
    ];
    const res = creneauxLibres({ ...base, dispo, occupe: [] });
    expect(res).toEqual([
      t('2026-11-10T09:00:00Z'),
      t('2026-11-10T09:30:00Z'),
      t('2026-11-10T10:00:00Z'),
    ]);
  });
});
```

- [ ] **Step 2 : Lancer → échec**

Run: `npx vitest run tests/disponibilites.test.js`
Expected: FAIL (`creneauxLibres` non défini).

- [ ] **Step 3 : Implémenter**

```js
// Toutes les durées en ms. Intervalles = { debut, fin } en ms epoch.
const MIN = 60 * 1000;

function fusionner(intervalles) {
  const tri = [...intervalles].sort((a, b) => a.debut - b.debut);
  const out = [];
  for (const iv of tri) {
    const dernier = out[out.length - 1];
    if (dernier && iv.debut <= dernier.fin) {
      dernier.fin = Math.max(dernier.fin, iv.fin);
    } else {
      out.push({ ...iv });
    }
  }
  return out;
}

function chevauche(aDebut, aFin, bDebut, bFin) {
  return aDebut < bFin && bDebut < aFin;
}

export function creneauxLibres({
  dispo,
  occupe,
  dureeMin,
  battementMin,
  granulariteMin,
  minLeadMs,
  maintenant,
}) {
  const duree = dureeMin * MIN;
  const battement = battementMin * MIN;
  const pas = granulariteMin * MIN;
  const plancherMin = maintenant + minLeadMs;

  const plages = fusionner(dispo);
  const resultats = [];

  for (const plage of plages) {
    for (let debut = plage.debut; debut + duree <= plage.fin; debut += pas) {
      const fin = debut + duree;
      if (debut < plancherMin) continue;

      // Conflit si un événement occupé chevauche [debut - battement, fin + battement]
      const conflit = occupe.some((ev) =>
        chevauche(debut - battement, fin + battement, ev.debut, ev.fin)
      );
      if (!conflit) resultats.push(debut);
    }
  }
  return resultats;
}
```

- [ ] **Step 4 : Lancer → succès**

Run: `npx vitest run tests/disponibilites.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
git add lib/disponibilites.js tests/disponibilites.test.js
git commit -m "feat: calcul pur des créneaux libres (durée, battement, délai mini)"
```

### Tâche 1.3 : Adaptateur Google Calendar (lecture)

Adaptateur fin (non testé unitairement en V1 ; validé en intégration avec l'agenda réel). Convertit les événements Google en intervalles ms.

**Files:**
- Create: `lib/google-calendar.js`

- [ ] **Step 1 : Implémenter l'auth + les lectures**

```js
import { google } from 'googleapis';

function clientCalendar() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

function enIntervalles(events) {
  return (events || [])
    .filter((e) => e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({
      debut: new Date(e.start.dateTime).getTime(),
      fin: new Date(e.end.dateTime).getTime(),
    }));
}

export async function lirePlagesDispo(fromMs, toMs) {
  const cal = clientCalendar();
  const { data } = await cal.events.list({
    calendarId: process.env.GOOGLE_CAL_DISPO_ID,
    timeMin: new Date(fromMs).toISOString(),
    timeMax: new Date(toMs).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });
  return enIntervalles(data.items);
}

export async function lireOccupe(fromMs, toMs) {
  const cal = clientCalendar();
  const { data } = await cal.events.list({
    calendarId: process.env.GOOGLE_CAL_RDV_ID,
    timeMin: new Date(fromMs).toISOString(),
    timeMax: new Date(toMs).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });
  return enIntervalles(data.items);
}
```

> Les fonctions d'écriture (`creerEvenement`, `supprimerEvenement`, `majEvenement`) seront ajoutées en Phase 2.

- [ ] **Step 2 : Commit**

```bash
git add lib/google-calendar.js
git commit -m "feat: adaptateur Google Calendar (lecture dispo/occupé)"
```

### Tâche 1.4 : Endpoint `GET /api/disponibilites`

Orchestration : borne la fenêtre (48h–60j), lit Google, applique `creneauxLibres`, renvoie les créneaux au fuseau `Europe/Paris`.

**Files:**
- Create: `api/disponibilites.js`

- [ ] **Step 1 : Implémenter**

```js
import { getPrestation } from '../lib/prestations.js';
import { creneauxLibres } from '../lib/disponibilites.js';
import { lirePlagesDispo, lireOccupe } from '../lib/google-calendar.js';

const H = 60 * 60 * 1000;
const J = 24 * H;

export default async function handler(req, res) {
  try {
    const { prestation, duree } = req.query;
    const p = getPrestation(prestation);
    const dureeMin = Number(duree);
    if (!p || !p.durees.some((d) => d.min === dureeMin)) {
      return res.status(400).json({ error: 'prestation ou durée invalide' });
    }

    const maintenant = Date.now();
    const from = maintenant;
    const to = maintenant + 60 * J;

    const [dispo, occupe] = await Promise.all([
      lirePlagesDispo(from, to),
      lireOccupe(from, to),
    ]);

    const creneaux = creneauxLibres({
      dispo,
      occupe,
      dureeMin,
      battementMin: 30,
      granulariteMin: 30,
      minLeadMs: 48 * H,
      maintenant,
    });

    res.status(200).json({
      prestation: p.slug,
      dureeMin,
      creneaux: creneaux.map((ms) => new Date(ms).toISOString()),
    });
  } catch (e) {
    res.status(500).json({ error: 'erreur serveur' });
  }
}
```

> La restriction « lun–sam 9h–19h » est portée par les plages « Disponibilité » que Delphine saisit (modèle fermé par défaut). On pourra ajouter un garde-fou serveur ultérieurement.

- [ ] **Step 2 : Vérifier en local** avec Vercel CLI et un `.env.local` rempli (nécessite les prérequis 0.1).

Run: `npx vercel dev` puis `curl "http://localhost:3000/api/disponibilites?prestation=suedois&duree=60"`
Expected: JSON `{ creneaux: [...] }` reflétant les plages « Disponibilité » de test de l'agenda.

- [ ] **Step 3 : Commit**

```bash
git add api/disponibilites.js
git commit -m "feat: endpoint GET /api/disponibilites"
```

### Tâche 1.5 : Page `/reservation.html` — étape « choisir un créneau »

Première version de la page : sélection prestation + durée → appel `/api/disponibilites` → affichage des créneaux. (Le formulaire de coordonnées et l'envoi viennent en Phase 2.) Reprend header/footer/charte via le skill `sync-header-footer`.

**Files:**
- Create: `reservation.html`

- [ ] **Step 1 : Créer la page** (structure + header/footer copiés d'une page existante, favicon, `style.css?v=14`), avec un bloc :

```html
<section>
  <div class="container-narrow">
    <h1>Réserver en ligne</h1>
    <label>Prestation
      <select id="prestation">
        <option value="suedois">Massage suédois</option>
        <option value="drainage">Drainage lymphatique</option>
        <option value="reflexologie">Réflexologie plantaire chinoise</option>
      </select>
    </label>
    <label>Durée <select id="duree"></select></label>
    <div id="creneaux" aria-live="polite"></div>
  </div>
</section>
<script>
  const DUREES = {
    suedois: [[60,70],[90,105]],
    drainage: [[60,70],[90,105]],
    reflexologie: [[60,70]],
  };
  const $ = (id) => document.getElementById(id);
  function majDurees() {
    const opts = DUREES[$('prestation').value]
      .map(([m,p]) => `<option value="${m}">${m===90?'1h30':'1h'} — ${p} €</option>`).join('');
    $('duree').innerHTML = opts;
  }
  async function majCreneaux() {
    const p = $('prestation').value, d = $('duree').value;
    $('creneaux').textContent = 'Chargement…';
    const r = await fetch(`/api/disponibilites?prestation=${p}&duree=${d}`);
    const data = await r.json();
    if (!data.creneaux?.length) { $('creneaux').textContent = 'Aucun créneau disponible pour le moment.'; return; }
    $('creneaux').innerHTML = data.creneaux.map((iso) => {
      const dt = new Date(iso).toLocaleString('fr-FR', { dateStyle:'full', timeStyle:'short', timeZone:'Europe/Paris' });
      return `<button class="btn btn-secondary" data-iso="${iso}">${dt}</button>`;
    }).join('');
  }
  $('prestation').addEventListener('change', () => { majDurees(); majCreneaux(); });
  $('duree').addEventListener('change', majCreneaux);
  // présélection depuis ?prestation=
  const pre = new URLSearchParams(location.search).get('prestation');
  if (pre && DUREES[pre]) $('prestation').value = pre;
  majDurees(); majCreneaux();
</script>
```

- [ ] **Step 2 : Vérifier le rendu** (`npx vercel dev`, ouvrir `/reservation.html`), créneaux cliquables affichés.

- [ ] **Step 3 : Commit**

```bash
git add reservation.html
git commit -m "feat: page réservation — sélection prestation/durée/créneau"
```

**Fin de Phase 1 : livrable fonctionnel = un visiteur voit en temps réel les créneaux libres de l'agenda de Delphine.**

---

## Roadmap — Phases 2 à 6 (à étoffer en tâches bite-sized au moment de les attaquer)

### Phase 2 — Création de réservation
- `lib/google-calendar.js` : ajouter `creerEvenement`, `supprimerEvenement`, `majEvenement`.
- `lib/supabase.js` : client service-role + helpers `creerReservation`, `getParToken`, `majStatut`.
- `lib/resend.js` : envoi + templates (confirmation, lien de paiement, rappel, annulation, récap Delphine).
- `api/reservations.js` (POST) : valider, **re-vérifier la dispo juste avant** (anti-concurrence), créer l'événement provisoire, insérer en base (`en_attente`), envoyer confirmation ; si `especes` → `confirme` directement + récap Delphine.
- `reservation.html` : étape coordonnées (nom/email/tél, message, case CGV, choix online/espèces) + page de confirmation.
- Tests : validation des entrées, mapping réservation→événement, règle espèces.

### Phase 3 — Paiement Stripe
- `lib/stripe.js` : `creerCheckoutSession(reservation)`, `rembourser(paymentIntent)`.
- `api/paiement/[token].js` (POST) : crée la session et redirige.
- `api/stripe/webhook.js` : vérifier la signature, traiter `checkout.session.completed` (idempotent) → `confirme`, `paye=true`, maj événement ; configurer le endpoint + `STRIPE_WEBHOOK_SECRET`.
- Tests : idempotence webhook (mock), transitions d'état.

### Phase 4 — Vercel Cron
- `api/cron.js` (protégé par `CRON_SECRET`) : envoi des liens de paiement (fenêtre ≤72h), annulation auto (<48h non payé), rappels (~24h). Horodatage anti-doublon.
- `vercel.json` : déclaration du cron horaire.
- Tests : sélection des réservations éligibles (fonctions pures sur jeux de données).

### Phase 5 — Annulation / report self-service
- `api/reservations/[token]/annuler.js` et `reporter.js` : règles >48h (libre) / <48h (bloqué) ; report = nouvelle vérif dispo + maj événement.
- Petites pages/retours HTML de confirmation.
- Mécanisme d'annulation côté Delphine (à trancher : détection agenda vs page admin légère).
- Tests : règles temporelles, remboursement si annulation Delphine sur résa payée.

### Phase 6 — Légal & intégration site
- `cgv.html` (brouillon CGV + politique d'annulation) ; maj `politique-confidentialite.html` (sous-traitants, finalités) ; maj `mentions-legales.html` (médiateur conso).
- Boutons « Réserver » des 3 pages massage → `/reservation.html?prestation=…` ; lien CGV au footer (skill `sync-header-footer`).
- `sitemap.xml` (+ `/reservation.html`, `/cgv.html`) ; `robots.txt` si besoin.
- Cache-buster CSS si styles ajoutés (skill `bump-css-cachebuster`).

---

## Auto-revue du plan (Phases 0–1)

- **Couverture spec** : disponibilités (§7) → Phase 1 ✓ ; modèle de données (§6) → Tâche 0.3 ✓ ; prestations/tarifs (§4) → Tâche 1.1 ✓ ; prérequis/config (§15) → Tâche 0.1 ✓. Les §8–14 sont couverts par la roadmap Phases 2–6 (à étoffer).
- **Placeholders** : aucun dans les Phases 0–1 (code complet fourni). La roadmap 2–6 est explicitement une feuille de route, pas des tâches à trous.
- **Cohérence des types** : `creneauxLibres({dispo, occupe, dureeMin, battementMin, granulariteMin, minLeadMs, maintenant})` identique entre test, implémentation et `api/disponibilites.js` ✓. Intervalles `{debut, fin}` en ms partout ✓. Catalogue `durees:[{min,prix}]` cohérent entre `lib/prestations.js` et le JS de `reservation.html` ✓.
