/**
 * De drempelverkenner: schuif een grens en zie hoeveel Amerikanen erboven zitten.
 *
 * Dit is het stuk dat een gepubliceerd gemiddelde niet kan. De steekproefgewichten
 * sommeren naar de werkelijke bevolking, dus de som boven een grens is een schatting
 * van het aantal mensen erboven.
 *
 * Belangrijk: in de staart draagt de steekproef zo'n schatting niet meer. Boven
 * MIN_RESPONDENTS tonen we een getal, daaronder zeggen we dat we het niet weten.
 * Een miljoenental op basis van een handvol respondenten is een verzonnen getal met
 * een echt uitziende komma.
 */
const MIN_RESPONDENTS = 30;

export function createThresholdExplorer({ thresholds, format, formatPopulation, labels, startAt }) {
  const el = (id) => document.getElementById(id);
  const slider = el('threshold-slider');
  if (!slider) return;

  const male = thresholds.male;
  const female = thresholds.female;

  slider.min = '0';
  slider.max = String(male.length - 1);
  slider.step = '1';

  // Zonder expliciete beginwaarde klemt de browser de standaard naar het maximum,
  // en dan opent de verkenner op de dunste staart: "too few to say". Begin op een
  // drempel waar het antwoord juist indruk maakt.
  const startIndex = male.reduce(
    (best, row, i) => (Math.abs(row.value - startAt) < Math.abs(male[best].value - startAt) ? i : best),
    0,
  );
  slider.value = String(startIndex);

  function describe(row) {
    if (row.respondents < MIN_RESPONDENTS) {
      return {
        headline: 'Too few to say',
        detail: `Only ${row.respondents} people in the survey are this tall, which is not enough to estimate a population from. We would rather say that than print a number we cannot stand behind.`,
        thin: true,
      };
    }
    return {
      headline: formatPopulation(row.population),
      detail: `${row.share.toFixed(1)}% of them`,
      thin: false,
    };
  }

  function render() {
    const i = Number(slider.value);
    const m = male[i];
    const f = female[i];

    el('threshold-value').textContent = format(m.value);
    slider.setAttribute('aria-valuetext', `${format(m.value)} or taller`);

    for (const [key, row] of [['male', m], ['female', f]]) {
      const info = describe(row);
      const box = el(`threshold-${key}`);
      box.querySelector('[data-headline]').textContent = info.headline;
      box.querySelector('[data-detail]').textContent = info.detail;
      box.dataset.thin = String(info.thin);
    }

    drawBar(m, f);
  }

  /** Twee balken die het aandeel boven de drempel tonen, met de rest uitgegrijsd. */
  function drawBar(m, f) {
    const svg = el('threshold-bar');
    const W = 640, barH = 46, gap = 30, padTop = 22;
    const rows = [
      { label: labels.male, row: m, y: padTop },
      { label: labels.female, row: f, y: padTop + barH + gap },
    ];

    svg.innerHTML = rows.map(({ label, row, y }) => {
      const w = Math.max((row.share / 100) * W, row.share > 0 ? 2 : 0);
      const pct = row.respondents < MIN_RESPONDENTS ? '' : `${row.share.toFixed(1)}%`;
      return `
        <text x="0" y="${y - 6}" font-size="13" font-weight="700" fill="var(--ink-soft)">${label}</text>
        <rect x="0" y="${y}" width="${W}" height="${barH}" rx="8" fill="var(--canvas)" />
        <rect x="0" y="${y}" width="${w.toFixed(1)}" height="${barH}" rx="8" fill="var(--data)" />
        <text x="${Math.min(w + 10, W - 60).toFixed(1)}" y="${y + barH / 2 + 5}"
              font-size="15" font-weight="700" fill="var(--ink)">${pct}</text>`;
    }).join('');
  }

  slider.addEventListener('input', render);
  render();
}
