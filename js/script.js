// ============================================
// DELPHINE MILLOT - SCRIPT COMPLET
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // 1. MENU MOBILE TOGGLE
    // ============================================
    window.toggleMenu = function() {
        const menu = document.getElementById('nav-menu');
        menu.classList.toggle('active');
    };
    
    // ============================================
    // 2. FAQ ACCORDÉON
    // ============================================
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            // Créer la flèche
            const arrow = document.createElement('span');
            arrow.className = 'faq-arrow';
            arrow.innerHTML = '▼';
            question.appendChild(arrow);
            
            // Cacher les réponses par défaut
            answer.style.display = 'none';
            
            // Toggle au clic
            question.addEventListener('click', function() {
                const isOpen = answer.style.display === 'block';
                
                // Fermer toutes les autres FAQ
                faqItems.forEach(otherItem => {
                    otherItem.querySelector('.faq-answer').style.display = 'none';
                    otherItem.querySelector('.faq-question').classList.remove('active');
                });
                
                // Ouvrir/fermer celle-ci
                if (!isOpen) {
                    answer.style.display = 'block';
                    question.classList.add('active');
                }
            });
        }
    });
    
    // ============================================
    // 3. HEADER QUI CHANGE AU SCROLL
    // ============================================
    const header = document.querySelector('header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // ============================================
    // 4. ANIMATIONS FADE-IN AU SCROLL
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Appliquer l'animation aux sections
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        observer.observe(section);
    });
    
    // ============================================
    // 5. AVIS DÉFILANTS (Duplication pour effet infini)
    // ============================================
    const avisSlider = document.querySelector('.avis-slider');
    if (avisSlider) {
        // Dupliquer les avis pour créer un effet de boucle infinie
        const avisCards = avisSlider.innerHTML;
        avisSlider.innerHTML = avisCards + avisCards;
    }
    
});
