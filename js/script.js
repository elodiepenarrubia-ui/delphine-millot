// FAQ Accordéon
document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
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
    });
});
