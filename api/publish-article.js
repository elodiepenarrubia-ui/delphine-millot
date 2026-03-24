export default async function handler(req, res) {

  // CORS - doit être en tout premier
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = req.headers["authorization"]?.replace("Bearer ", "");
  if (secret !== process.env.PUBLISH_SECRET) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const { slug, titre, description, date, intro, corps } = req.body;
  if (!slug || !titre || !corps) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  const dateObj = new Date(date || new Date());
  const dateDisplay = dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titre} | Delphine Millot</title>
<meta name="description" content="${description}">
<link rel="stylesheet" href="/css/style.css">
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
      <a href="/blog/index.html" style="color: var(--orange-cuivre);">← Blog</a> · ${dateDisplay}
    </p>
    <h1>${titre}</h1>
    ${intro ? `<p style="font-size: 1.2rem; color: var(--gris-texte); font-style: italic; margin-bottom: var(--spacing-lg);">${intro}</p>` : ""}
    <div style="margin-top: var(--spacing-lg);">
      ${corps}
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
      <p>&copy; 2025 Delphine Millot - Tous droits réservés</p>
      <p>Fait avec ❤️ par <a href="https://agence-aurore.fr" target="_blank">l'Agence Aurore</a></p>
    </div>
  </div>
</footer>
<script>
function toggleMenu() {
  document.getElementById('nav-menu').classList.toggle('active');
}
</script>
<script src="/js/script.js"></script>
</body>
</html>`;

  const filePath = `blog/${slug}.html`;
  const fileContent = Buffer.from(html).toString("base64");
  const githubUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${filePath}`;

  try {
    let sha;
    const check = await fetch(githubUrl, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
    });
    if (check.ok) { const ex = await check.json(); sha = ex.sha; }

    const create = await fetch(githubUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Article : ${titre}`,
        content: fileContent,
        ...(sha ? { sha } : {})
      })
    });

    if (!create.ok) {
      const err = await create.json();
      return res.status(500).json({ error: "Erreur GitHub", details: err.message });
    }

    return res.status(200).json({
      success: true,
      message: "Article publié avec succès",
      url: `https://delphine-millot.fr/blog/${slug}.html`
    });

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}