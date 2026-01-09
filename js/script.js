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
    // 5. AVIS DÉFILANTS (Animation fluide sans saut)
    // ============================================
    const avisSlider = document.querySelector('.avis-slider');
    if (avisSlider) {
        // Dupliquer les avis pour la boucle infinie
        const avisCards = avisSlider.innerHTML;
        avisSlider.innerHTML = avisCards + avisCards;
        
        // Désactiver l'animation CSS
        avisSlider.style.animation = 'none';
        
        let position = 0;
        const speed = 0.8; // pixels par frame (ajuste si besoin)
        let animationId;
        let isPaused = false;
        
        // Calculer la largeur d'un set complet d'avis
        const firstCard = avisSlider.querySelector('.avis-card');
        const cardWidth = firstCard ? firstCard.offsetWidth : 360;
        const gap = 48; // var(--spacing-lg) = 3rem = 48px
        const totalCards = avisSlider.querySelectorAll('.avis-card').length / 2;
        const oneSetWidth = (cardWidth + gap) * totalCards;
        
        function animate() {
            if (!isPaused) {
                position -= speed;
                
                // Quand on a défilé un set complet, on repositionne sans saut
                if (Math.abs(position) >= oneSetWidth) {
                    position = 0;
                }
                
                avisSlider.style.transform = `translateX(${position}px)`;
            }
            animationId = requestAnimationFrame(animate);
        }
        
        // Démarrer l'animation
        animate();
        
        // Pause au survol
        avisSlider.addEventListener('mouseenter', () => {
            isPaused = true;
        });
        
        avisSlider.addEventListener('mouseleave', () => {
            isPaused = false;
        });
        
        // Nettoyer l'animation si la page est fermée
        window.addEventListener('beforeunload', () => {
            cancelAnimationFrame(animationId);
        });
    }
    
});
