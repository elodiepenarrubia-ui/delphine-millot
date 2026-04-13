import crypto from "node:crypto";

// ─── CONFIG ───
const ALLOWED_ORIGIN = "https://delphine-millot.fr";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 80;
const CORPS_MAX = 200_000;
const TITRE_MAX = 300;
const DESC_MAX = 500;
const INTRO_MAX = 1000;

// ─── RATE LIMIT (module-scoped, persiste entre invocations chaudes) ───
const rateBuckets = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || now > b.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= max;
}

// ─── SANITIZE ───
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeBody(html) {
  if (!html) return "";
  let out = String(html);
  // Supprime les balises dangereuses avec leur contenu
  out = out.replace(/<\s*(script|style|iframe|object|embed|form|input|button|svg|math|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  // Et leurs variantes auto-fermantes
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta|svg)\b[^>]*\/?>/gi, "");
  // Retire les gestionnaires d'événements on* = ...
  out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");
  // Neutralise les URL javascript: et data:text/html
  out = out.replace(/(href|src|xlink:href|formaction|action)\s*=\s*"(?:\s*(?:javascript|vbscript):|\s*data:text\/html)[^"]*"/gi, '$1="#"');
  out = out.replace(/(href|src|xlink:href|formaction|action)\s*=\s*'(?:\s*(?:javascript|vbscript):|\s*data:text\/html)[^']*'/gi, "$1='#'");
  return out;
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ba.length !== bb.length) {
    // Compare quand même pour éviter le side-channel sur la longueur
    crypto.timingSafeEqual(ba, Buffer.alloc(ba.length));
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

export default async function handler(req, res) {
  // ─── CORS strict ───
  const origin = req.headers.origin;
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  // ─── Rate limit global par IP ───
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!rateLimit(`all:${ip}`, 60, 5 * 60_000)) {
    return res.status(429).json({ error: "Trop de requêtes" });
  }

  // ─── Auth (comparaison en temps constant) ───
  const secret = req.headers["authorization"]?.replace(/^Bearer\s+/, "") || "";
  const expected = process.env.PUBLISH_SECRET || "";
  const ok = expected.length > 0 && timingSafeEqual(secret, expected);
  if (!ok) {
    // Rate limit agressif sur les échecs
    if (!rateLimit(`401:${ip}`, 10, 10 * 60_000)) {
      return res.status(429).json({ error: "Trop de tentatives" });
    }
    await new Promise(r => setTimeout(r, 400)); // ralentissement constant
    return res.status(401).json({ error: "Non autorisé" });
  }

  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const TOKEN = process.env.GITHUB_TOKEN;

  const ghHeaders = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  async function getFile(path) {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, { headers: ghHeaders });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`GitHub GET ${path} a échoué (${r.status})`);
    return r.json();
  }

  async function putFile(path, content, message, sha) {
    const body = { message, content: Buffer.from(content).toString("base64") };
    if (sha) body.sha = sha;
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: "PUT", headers: ghHeaders, body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`GitHub PUT ${path} a échoué (${r.status}): ${text.slice(0, 200)}`);
    }
    return r;
  }

  async function deleteFile(path, message, sha) {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: "DELETE", headers: ghHeaders,
      body: JSON.stringify({ message, sha }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`GitHub DELETE ${path} a échoué (${r.status}): ${text.slice(0, 200)}`);
    }
    return r;
  }

  async function getIndex() {
    const file = await getFile("blog/index.json");
    if (!file) return { data: { articles: [] }, sha: null };
    const content = Buffer.from(file.content, "base64").toString("utf8");
    return { data: JSON.parse(content), sha: file.sha };
  }

  // saveIndex avec retry sur conflit 409 (race condition)
  async function saveIndex(updateFn, message) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, sha } = await getIndex();
      const articles = updateFn(data?.articles || []);
      const content = JSON.stringify({ articles }, null, 2);
      try {
        return await putFile("blog/index.json", content, message, sha);
      } catch (err) {
        if (/409/.test(err.message) && attempt < 2) continue;
        throw err;
      }
    }
  }

  function validSlug(s) {
    return typeof s === "string" && s.length > 0 && s.length <= SLUG_MAX && SLUG_RE.test(s);
  }

  // ─── GET ───
  if (req.method === "GET") {
    const action = req.query.action;

    if (action === "list") {
      try {
        const { data } = await getIndex();
        const articles = (data?.articles || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        return res.status(200).json({ articles });
      } catch (err) {
        return res.status(500).json({ error: "Erreur liste", details: err.message });
      }
    }

    if (action === "get") {
      const slug = req.query.slug;
      if (!validSlug(slug)) return res.status(400).json({ error: "Slug invalide" });
      try {
        const file = await getFile(`blog/${slug}.html`);
        if (!file) return res.status(404).json({ error: "Article introuvable" });
        const html = Buffer.from(file.content, "base64").toString("utf8");

        const titre = (html.match(/<title>([^|]+)\|/) || [])[1]?.trim() || slug.replace(/-/g, " ");
        const description = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || "";
        const date = (html.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || "";
        const introMatch = html.match(/<!-- INTRO_START -->([\s\S]*?)<!-- INTRO_END -->/);
        const intro = introMatch ? introMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const corpsMatch = html.match(/<!-- CORPS_START -->([\s\S]*?)<!-- CORPS_END -->/);
        const corps = corpsMatch ? corpsMatch[1].trim() : "";

        return res.status(200).json({ article: { titre, description, date, intro, corps } });
      } catch (err) {
        return res.status(500).json({ error: "Erreur lecture", details: err.message });
      }
    }

    return res.status(405).json({ error: "Action inconnue" });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, slug, titre, description, date, intro, corps } = req.body || {};

  // ─── SUPPRESSION ───
  if (action === "delete") {
    if (!validSlug(slug)) return res.status(400).json({ error: "Slug invalide" });
    try {
      const file = await getFile(`blog/${slug}.html`);
      if (!file) return res.status(404).json({ error: "Article introuvable" });
      await deleteFile(`blog/${slug}.html`, `Suppression : ${slug}`, file.sha);
      await saveIndex(
        (articles) => articles.filter(a => a.slug !== slug),
        `Index : suppression ${slug}`
      );
      return res.status(200).json({ success: true, message: "Article supprimé" });
    } catch (err) {
      return res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
  }

  // ─── PUBLICATION / MISE À JOUR ───
  if (!validSlug(slug)) return res.status(400).json({ error: "Slug invalide (minuscules, chiffres, tirets uniquement)" });
  if (!titre || typeof titre !== "string" || titre.length > TITRE_MAX) return res.status(400).json({ error: "Titre manquant ou trop long" });
  if (!corps || typeof corps !== "string" || corps.length > CORPS_MAX) return res.status(400).json({ error: "Corps manquant ou trop long" });
  if (description && (typeof description !== "string" || description.length > DESC_MAX)) return res.status(400).json({ error: "Description trop longue" });
  if (intro && (typeof intro !== "string" || intro.length > INTRO_MAX)) return res.status(400).json({ error: "Intro trop longue" });

  // Échappement / sanitization
  const safeTitre = escapeHtml(titre);
  const safeDesc = escapeHtml(description || "");
  const safeIntro = escapeHtml(intro || "");
  const safeCorps = sanitizeBody(corps);

  const dateObj = new Date(date || new Date());
  if (isNaN(dateObj.getTime())) return res.status(400).json({ error: "Date invalide" });
  const dateDisplay = dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const dateISO = dateObj.toISOString().split("T")[0];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitre} | Delphine Millot</title>
<meta name="description" content="${safeDesc}">
<link rel="stylesheet" href="/css/style.css?v=6">
</head>
<body>
<header>
  <div class="header-content">
    <div class="logo">
      <a href="/index.html">
        <img src="/images/logo.png" alt="Delphine Millot - Corps, Cœur, Conscience" class="logo-full">
        <img src="/images/favicon.png" alt="Delphine Millot" class="logo-favicon">
      </a>
    </div>
    <nav>
      <button class="menu-toggle" aria-label="Menu" onclick="toggleMenu()"><span></span><span></span><span></span></button>
      <ul id="nav-menu">
        <li><a href="/index.html">Accueil</a></li>
        <li class="nav-item-with-submenu">
          <a href="/massages.html">Massages</a>
          <ul class="submenu">
            <li><a href="/massages/massage-suedois.html">Massage Suédois</a></li>
            <li><a href="/massages/massage-tantrique.html">Massage Tantrique</a></li>
            <li><a href="/massages/massage-lomi-lomi.html">Massage Lomi Lomi</a></li>
            <li><a href="/massages/drainage-lymphatique.html">Drainage Lymphatique</a></li>
            <li><a href="/massages/massage-therapeutique.html">Massage Thérapeutique</a></li>
            <li><a href="/massages/massage-4-mains-duo.html">Massage 4 Mains et Duo</a></li>
          </ul>
        </li>
        <li><a href="/qi-gong.html">Qi Gong</a></li>
        <li><a href="/a-propos.html">À propos</a></li>
        <li><a href="/blog/index.html">Blog</a></li>
        <li class="nav-cta-mobile"><a href="tel:+33628132536" class="btn btn-primary">06 28 13 25 36</a></li>
      </ul>
    </nav>
    <div class="header-cta">
      <a href="tel:+33628132536" class="header-phone-btn">06 28 13 25 36</a>
    </div>
  </div>
</header>

<article style="padding: var(--spacing-xl) 0;">
  <div class="container-narrow">
    <p style="color: var(--orange-cuivre); font-size: 0.9rem; margin-bottom: var(--spacing-sm);">
      <a href="/blog/index.html" style="color: var(--orange-cuivre);">← Blog</a> · ${dateDisplay} · <span data-iso="${dateISO}"></span>
    </p>
    <h1>${safeTitre}</h1>
    ${safeIntro ? `<!-- INTRO_START --><p style="font-size: 1.2rem; color: var(--gris-texte); font-style: italic; margin-bottom: var(--spacing-lg);">${safeIntro}</p><!-- INTRO_END -->` : "<!-- INTRO_START --><!-- INTRO_END -->"}
    <div>
      <!-- CORPS_START -->
${safeCorps}
      <!-- CORPS_END -->
    </div>
    <div style="margin-top: var(--spacing-xl); text-align: center; padding: var(--spacing-lg); background: var(--blanc-casse); border-radius: var(--border-radius);">
      <p style="margin-bottom: var(--spacing-md);">Envie d'en savoir plus ou de prendre rendez-vous ?</p>
      <a href="tel:+33628132536" class="btn btn-primary">Contacter Delphine</a>
    </div>
  </div>
</article>

<footer>
  <div class="container">
    <div class="footer-cta">
      <p>Vous avez apprécié votre séance ?</p>
      <a href="https://maps.app.goo.gl/B99F9CMtDDj8VtBL9" target="_blank" class="btn btn-primary">Laisser un avis</a>
    </div>
    <div class="footer-content">
      <div class="footer-section">
        <h3>Delphine Millot</h3>
        <p>Massages bien-être & Qi Gong<br>Brignoles, Var (83)</p>
        <p><em>Corps, Cœur, Conscience</em></p>
      </div>
      <div class="footer-section">
        <h3>Contact</h3>
        <p>Téléphone : <a href="tel:+33628132536">06 28 13 25 36</a></p>
      </div>
      <div class="footer-section">
        <h3>Navigation</h3>
        <ul class="footer-links">
          <li><a href="/index.html">Accueil</a></li>
          <li><a href="/massages.html">Massages</a></li>
          <li><a href="/qi-gong.html">Qi Gong</a></li>
          <li><a href="/a-propos.html">À propos</a></li>
          <li><a href="/blog/index.html">Blog</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h3>Légal</h3>
        <ul class="footer-links">
          <li><a href="/mentions-legales.html">Mentions légales</a></li>
          <li><a href="/politique-confidentialite.html">Politique de confidentialité</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Delphine Millot - Tous droits réservés</p>
      <p>Fait avec ❤️ par <a href="https://agence-aurore.fr" target="_blank"><strong>l'Agence Aurore</strong></a></p>
      <p style="margin-top: 0.5rem;"><a href="/admin/" style="color: rgba(255,255,255,0.3); font-size: 0.75rem;">Administration</a></p>
    </div>
  </div>
</footer>
<script>
function toggleMenu() { document.getElementById('nav-menu').classList.toggle('active'); }
</script>
<script src="/js/script.js" defer></script>
<!-- Bulle WhatsApp flottante -->
<a class="whatsapp-bubble" href="https://wa.me/33628132536" target="_blank" rel="noopener" aria-label="Contacter Delphine par WhatsApp">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.48A11.82 11.82 0 0 0 12.05 0C5.5 0 .18 5.32.18 11.87a11.8 11.8 0 0 0 1.59 5.93L0 24l6.34-1.66a11.87 11.87 0 0 0 5.7 1.45h.01c6.55 0 11.87-5.32 11.87-11.87 0-3.17-1.23-6.15-3.4-8.44zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.76.99 1-3.67-.23-.38a9.82 9.82 0 0 1-1.52-5.28c0-5.45 4.43-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.81 9.81 0 0 1 2.89 6.99c0 5.45-4.43 9.88-9.88 9.88zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.51l-.58-.01c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.35.19 1.86.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/></svg>
</a>
</body>
</html>`;

  try {
    const existing = await getFile(`blog/${slug}.html`);
    await putFile(
      `blog/${slug}.html`, html,
      `${action === "update" ? "Mise à jour" : "Article"} : ${titre}`,
      existing?.sha
    );

    const entry = { slug, titre, description: description || "", date: dateISO };
    await saveIndex(
      (articles) => {
        const idx = articles.findIndex(a => a.slug === slug);
        if (idx >= 0) articles[idx] = entry;
        else articles.unshift(entry);
        return articles;
      },
      `Index : ${action === "update" ? "màj" : "ajout"} ${slug}`
    );

    return res.status(200).json({
      success: true,
      message: action === "update" ? "Article mis à jour" : "Article publié",
      url: `https://delphine-millot.fr/blog/${slug}.html`
    });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}
