// ============================================
// DELPHINE MILLOT - SCRIPT COMPLET
// ============================================

// Fonction globale accessible depuis les onclick inline (doit rester hors DOMContentLoaded)
window.toggleMenu = function() {
    const menuList = document.getElementById('nav-menu');
    const menuBtn = document.querySelector('.menu-toggle');
    if (!menuList) return;
    const isOpen = menuList.classList.toggle('active');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(isOpen));
};

document.addEventListener('DOMContentLoaded', function() {

    // ============================================
    // 1. MENU MOBILE : fermer avec Escape
    // ============================================
    const menuBtn = document.querySelector('.menu-toggle');
    const menuList = document.getElementById('nav-menu');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuList && menuList.classList.contains('active')) {
            menuList.classList.remove('active');
            if (menuBtn) {
                menuBtn.setAttribute('aria-expanded', 'false');
                menuBtn.focus();
            }
        }
    });

    // ============================================
    // 1.5 LIEN ACTIF SELON L'URL
    // ============================================
    const currentPath = window.location.pathname;

    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });

    document.querySelectorAll('nav > ul > li > a').forEach(link => {
        const linkPath = link.getAttribute('href');
        if (
            currentPath === linkPath ||
            (linkPath !== '/index.html' && linkPath !== '/' && currentPath.startsWith(linkPath.replace('.html', '')))
        ) {
            link.classList.add('active');
        }
    });

    // ============================================
    // 2. SOUS-MENU MASSAGES (mobile uniquement)
    // ============================================
    document.querySelectorAll('.nav-item-with-submenu > a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                this.closest('.nav-item-with-submenu').classList.toggle('active');
            }
        });
    });

    // ============================================
    // 3. FAQ ACCORDÉON (accessible clavier + lecteur d'écran)
    // ============================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item, i) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (!question || !answer) return;

        // Rendre le <p> accessible comme un bouton
        question.setAttribute('role', 'button');
        question.setAttribute('tabindex', '0');
        question.setAttribute('aria-expanded', 'false');
        const ansId = answer.id || `faq-ans-${i}`;
        answer.id = ansId;
        question.setAttribute('aria-controls', ansId);

        const arrow = document.createElement('span');
        arrow.className = 'faq-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        question.appendChild(arrow);

        answer.style.display = 'none';

        function toggle() {
            const isOpen = answer.style.display === 'block';
            faqItems.forEach(other => {
                const q = other.querySelector('.faq-question');
                const a = other.querySelector('.faq-answer');
                if (a) a.style.display = 'none';
                if (q) {
                    q.classList.remove('active');
                    q.setAttribute('aria-expanded', 'false');
                }
            });
            if (!isOpen) {
                answer.style.display = 'block';
                question.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        }

        question.addEventListener('click', toggle);
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    });

    // ============================================
    // 4. HEADER QUI CHANGE AU SCROLL (passive pour perf)
    // ============================================
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        if (!header) return;
        if (window.pageYOffset > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });

    // ============================================
    // 5. ANIMATIONS FADE-IN AU SCROLL
    //    (plus d'opacity:0 forcé en JS : si JS échoue,
    //    les sections restent visibles)
    // ============================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // ============================================
    // 6. AVIS DÉFILANTS (respecte prefers-reduced-motion)
    // ============================================
    const avisSlider = document.querySelector('.avis-slider');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (avisSlider && !reduceMotion) {
        const avisCards = avisSlider.innerHTML;
        avisSlider.innerHTML = avisCards + avisCards;

        avisSlider.style.animation = 'none';

        let position = 0;
        const speed = 0.8;
        let animationId;
        let isPaused = false;

        const firstCard = avisSlider.querySelector('.avis-card');
        const cardWidth = firstCard ? firstCard.offsetWidth : 360;
        const gap = 48;
        const totalCards = avisSlider.querySelectorAll('.avis-card').length / 2;
        const oneSetWidth = (cardWidth + gap) * totalCards;

        function animate() {
            if (!isPaused) {
                position -= speed;
                if (Math.abs(position) >= oneSetWidth) {
                    position = 0;
                }
                avisSlider.style.transform = `translateX(${position}px)`;
            }
            animationId = requestAnimationFrame(animate);
        }

        animate();

        avisSlider.addEventListener('mouseenter', () => { isPaused = true; });
        avisSlider.addEventListener('mouseleave', () => { isPaused = false; });
        avisSlider.addEventListener('focusin', () => { isPaused = true; });
        avisSlider.addEventListener('focusout', () => { isPaused = false; });
        window.addEventListener('beforeunload', () => { cancelAnimationFrame(animationId); });
    }

});
