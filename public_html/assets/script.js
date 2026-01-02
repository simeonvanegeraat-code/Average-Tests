/* assets/script.js - Logic for HumanAverage 2.0 (Expanded Search) */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Compare Tool Logic ---
    const compareBtn = document.getElementById('run-compare');
    if(compareBtn) {
        compareBtn.addEventListener('click', runComparison);
    }

    // --- 2. Dynamic Year Update ---
    const yearElements = document.querySelectorAll('.current-year');
    yearElements.forEach(el => el.textContent = new Date().getFullYear());

    // --- 3. Advanced Search Logic ---
    const searchInput = document.querySelector('.search-container input');
    if(searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSmartSearch(searchInput.value);
            }
        });
    }
});

/**
 * DATABASE: Hier definiëren we alle pagina's en hun trefwoorden.
 * Dit maakt de zoekfunctie slim en uitgebreid.
 */
const searchDatabase = [
    {
        url: "salary.html",
        keywords: ["salary", "income", "money", "finance", "wage", "pay", "earning", "dollar", "euro", "rich", "poor", "tax", "gross", "net", "wealth"]
    },
    {
        url: "body.html",
        keywords: ["body", "health", "height", "weight", "tall", "short", "fat", "thin", "bmi", "cm", "kg", "life", "age", "die", "death"]
    },
    {
        url: "work.html",
        keywords: ["work", "job", "career", "hours", "week", "boss", "retire", "pension", "productive", "lazy", "office", "holiday"]
    },
    {
        url: "lifestyle.html",
        keywords: ["lifestyle", "habit", "coffee", "caffeine", "drink", "screen", "phone", "mobile", "internet", "sleep", "bed", "insomnia"]
    },
    {
        url: "demographics.html",
        keywords: ["people", "population", "human", "world", "india", "china", "family", "kids", "baby", "migration", "growth"]
    },
    {
        url: "compare.html",
        keywords: ["compare", "tool", "calculator", "rank", "percentile", "test", "quiz", "check", "measure"]
    },
    // Specifieke Artikelen
    {
        url: "articles/why-dutch-are-tall.html",
        keywords: ["dutch", "netherlands", "holland", "giant", "genetics", "milk", "dairy"]
    },
    {
        url: "articles/salary-usa-vs-europe.html",
        keywords: ["usa", "america", "europe", "eu", "healthcare", "cost"]
    },
    {
        url: "articles/4-day-work-week.html",
        keywords: ["4 day", "four day", "iceland", "japan", "stress", "burnout"]
    },
    {
        url: "articles/coffee-addiction.html",
        keywords: ["finland", "addict", "espresso", "starbucks"]
    }
];

function handleSmartSearch(query) {
    const term = query.toLowerCase().trim();
    if(!term) return;

    // 1. Zoek naar de beste match in de database
    // We kijken of een van de keywords voorkomt in de zoekopdracht
    const match = searchDatabase.find(page => 
        page.keywords.some(keyword => term.includes(keyword))
    );

    // 2. Actie ondernemen
    if (match) {
        // Match gevonden -> Ga naar de pagina
        console.log(`Searching for "${term}" -> Found match: ${match.url}`);
        window.location.href = match.url;
    } else {
        // Geen match -> Toon suggesties
        alert(`No direct match found for "${term}".\n\nTry searching for broader categories like:\n- Salary\n- Height\n- Work\n- Coffee\n- Population`);
    }
}

// --- Compare Tool Logic (Ongewijzigd, maar essentieel voor compare.html) ---
function runComparison() {
    const category = document.getElementById('category').value;
    const inputVal = parseFloat(document.getElementById('user-input').value);
    const resultArea = document.getElementById('result-area');
    const resultTitle = document.getElementById('result-title');
    const resultText = document.getElementById('result-text');
    const progressBar = document.getElementById('percentile-bar');

    if (!inputVal) {
        alert("Please enter a valid number.");
        return;
    }

    const benchmarks = {
        'salary': { avg: 1350, label: 'USD/month', direction: 'higher' },
        'height': { avg: 171, label: 'cm', direction: 'higher' },
        'screen': { avg: 6.8, label: 'hours/day', direction: 'lower' }
    };

    const data = benchmarks[category];
    if (!data) return;

    let diff = ((inputVal - data.avg) / data.avg) * 100;
    
    // Percentile logic
    let percentile = 50; 
    if (data.direction === 'higher') {
        percentile = 50 + (diff / 2);
    } else {
        percentile = 50 - (diff / 2);
    }
    percentile = Math.max(1, Math.min(99, percentile));

    let status = "";
    if (percentile >= 80) status = "Top Tier (Top 20%)";
    else if (percentile >= 60) status = "Above Average";
    else if (percentile >= 40) status = "Average";
    else status = "Below Average";

    resultArea.style.display = 'block';
    resultTitle.textContent = `${status}`;
    resultText.innerHTML = `
        You entered <strong>${inputVal} ${data.label}</strong>.<br>
        The global average is <strong>${data.avg} ${data.label}</strong>.<br>
        You rank better than <strong>${Math.round(percentile)}%</strong> of the world.
    `;
    
    setTimeout(() => {
        progressBar.style.width = `${percentile}%`;
        if(percentile > 75) progressBar.style.backgroundColor = '#10b981';
        else if(percentile < 25) progressBar.style.backgroundColor = '#ef4444';
        else progressBar.style.backgroundColor = '#6366f1';
    }, 100);

    resultArea.scrollIntoView({ behavior: 'smooth' });
}