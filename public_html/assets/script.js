/* assets/script.js - Logic for HumanAverage 2.0 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Compare Tool Logic ---
    const compareBtn = document.getElementById('run-compare');
    if(compareBtn) {
        compareBtn.addEventListener('click', runComparison);
    }

    // --- Dynamic Year Update ---
    const yearElements = document.querySelectorAll('.current-year');
    yearElements.forEach(el => el.textContent = new Date().getFullYear());
});

function runComparison() {
    const category = document.getElementById('category').value;
    const inputVal = parseFloat(document.getElementById('user-input').value);
    const region = document.getElementById('region').value;
    const resultArea = document.getElementById('result-area');
    const resultTitle = document.getElementById('result-title');
    const resultText = document.getElementById('result-text');
    const progressBar = document.getElementById('percentile-bar');

    if (!inputVal) {
        alert("Please enter a valid number.");
        return;
    }

    // Mock Data for 2026 (In a real app, this comes from a database)
    // Format: Category -> { globalAvg, label, betterDirection }
    const benchmarks = {
        'salary': { avg: 1350, label: 'USD/month', direction: 'higher' }, // Global Net Avg
        'height': { avg: 171, label: 'cm', direction: 'higher' },
        'screen': { avg: 6.8, label: 'hours/day', direction: 'lower' }
    };

    const data = benchmarks[category];
    if (!data) return;

    // Calculate difference percentage
    let diff = ((inputVal - data.avg) / data.avg) * 100;
    let percentile = 50; // Default middle

    // Simple logic to simulate percentile
    if (diff > 0) percentile = Math.min(99, 50 + (diff / 2));
    if (diff < 0) percentile = Math.max(1, 50 + (diff / 2));

    // Determine status text
    let status = "";
    const isHigherBetter = data.direction === 'higher';
    
    if (inputVal > data.avg) {
        status = isHigherBetter ? "Top Tier!" : "Above Average (Warning)";
    } else {
        status = isHigherBetter ? "Below Average" : "Excellent Balance";
    }

    // Render Results
    resultArea.style.display = 'block';
    resultTitle.textContent = `${status} (${Math.round(percentile)}th Percentile)`;
    resultText.innerHTML = `
        You entered <strong>${inputVal} ${data.label}</strong>.<br>
        The global average is <strong>${data.avg} ${data.label}</strong>.<br>
        ${diff > 0 ? "You are " + Math.round(diff) + "% higher" : "You are " + Math.round(Math.abs(diff)) + "% lower"} than the average human.
    `;
    
    // Animate Bar
    setTimeout(() => {
        progressBar.style.width = `${percentile}%`;
        progressBar.style.backgroundColor = (percentile > 75 && isHigherBetter) ? 'var(--success)' : 'var(--accent)';
    }, 100);

    // Scroll to result
    resultArea.scrollIntoView({ behavior: 'smooth' });
}