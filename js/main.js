/* HUMAN AVERAGE - CENTRAL JAVASCRIPT */

document.addEventListener('DOMContentLoaded', () => {
    console.log('HumanAverage.com: Systeem geladen.');
    initMobileMenu();
});

/**
 * Mobiel Menu Logica
 * Zorgt ervoor dat het menu op mobiel geopend en gesloten kan worden.
 */
function initMobileMenu() {
    const nav = document.querySelector('.nav-links');
    // We voegen een 'hamburger' knop toe via JS als die er nog niet is
    if (window.innerWidth < 768 && !document.querySelector('.menu-toggle')) {
        const navContent = document.querySelector('.nav-content');
        const toggle = document.createElement('button');
        toggle.classList.add('menu-toggle');
        toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        toggle.style.cssText = "background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--primary);";
        
        navContent.appendChild(toggle);

        toggle.addEventListener('click', () => {
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '60px';
            nav.style.left = '0';
            nav.style.width = '100%';
            nav.style.background = 'white';
            nav.style.padding = '20px';
            nav.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
        });
    }
}

/**
 * Shared Helper: Getallen mooi formatteren
 * Gebruik: formatCurrency(2500) -> € 2.500
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Shared Helper: Percentage animatie
 * Gebruik: animateValue("elementId", 0, 85, 1000)
 */
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + "%";
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}