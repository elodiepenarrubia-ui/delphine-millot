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
    // 3. FAQ ACCORDÉON
    // ============================================
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            const arrow = document.createElement('span');
            arrow.className = 'faq-arrow';
            arrow.innerHTML = '▼';
            question.appendChild(arrow);
            
            answer.style.display = 'none';
            
            question.addEventListener('click', function() {
                const isOpen = answer.style.display === 'block';
                
                faqItems.forEach(otherItem => {
                    otherItem.querySelector('.faq-answer').style.display = 'none';
                    otherItem.querySelector('.faq-question').classList.remove('active');
                });
                
                if (!isOpen) {
                    answer.style.display = 'block';
                    question.classList.add('active');
                }
            });
        }
    });
    
    // ============================================
    // 4. HEADER QUI CHANGE AU SCROLL
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
    // 5. ANIMATIONS FADE-IN AU SCROLL
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
    
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        observer.observe(section);
    });
    
    // ============================================
    // 6. AVIS DÉFILANTS (Animation fluide sans saut)
    // ============================================
    const avisSlider = document.querySelector('.avis-slider');
    if (avisSlider) {
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
        window.addEventListener('beforeunload', () => { cancelAnimationFrame(animationId); });
    }
    
});