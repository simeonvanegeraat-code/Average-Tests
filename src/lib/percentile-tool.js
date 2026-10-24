/**
 * Gedeeld gedrag voor de percentieltools.
 *
 * De metriekpagina's leveren alleen aan hoe hun invoervelden werken en hoe een
 * waarde eruitziet; validatie, opzoeken, tekenen, delen en het herstellen van een
 * gedeelde link zitten hier. Zo kan de kopij per pagina verschillen zonder dat de
 * rekenkant twee keer bestaat en uit elkaar loopt.
 */
import { lookupPercentile, densityFromQuantiles, ordinal } from './percentile.js';
import { track, EVENTS } from './analytics.js';

export function createPercentileTool(config) {
  const {
    table,            // ingelezen percentieltabel
    metric,           // 'height' | 'weight'
    comparative,      // { more: 'taller', less: 'shorter' }
    readValue,        // (unit) => number | null, in de eenheid van de dataset
    writeValue,       // (unit, value) => void, vult de invoervelden
    format,           // (value, unit) => string
    formatDifference, // (delta, unit) => string
    valueRange,       // { min, max, message }
    shareParam,       // naam van de queryparameter, bv. 'cm'
  } = config;

  const el = (id) => document.getElementById(id);
  const form = el(`${metric}-form`);
  const result = el('result');
  const errorNote = el('form-error');
  if (!form) return;

  const unitOf = () => form.querySelector('input[name="unit"]:checked').value;

  function syncUnits() {
    const unit = unitOf();
    el('input-imperial').hidden = unit !== 'imperial';
    el('input-metric').hidden = unit === 'imperial';
    // Waarde meenemen bij het wisselen, zodat je invoer niet verdwijnt.
    const current = readValue(unit === 'imperial' ? 'metric' : 'imperial');
    if (current !== null) writeValue(unit, current);
  }
  form.querySelectorAll('input[name="unit"]').forEach((r) => r.addEventListener('change', syncUnits));

  function fail(message) {
    errorNote.textContent = message;
    errorNote.hidden = false;
    result.classList.remove('visible');
  }

  function render(sex, age, value) {
    const found = lookupPercentile(table, sex, age, value);
    if (!found) return fail('We do not have data for that combination.');

    const unit = unitOf();
    const group = sex === 'male' ? 'men' : 'women';
    const rounded = Math.round(found.percentile);

    el('result-percentile').textContent = found.bound
      ? (found.bound === 'below' ? 'Below the 1st' : 'Above the 99th')
      : ordinal(rounded);

    el('result-sentence').textContent =
      found.bound === 'above'
        ? `You are ${comparative.more} than more than 99% of American ${group} aged ${age}.`
        : found.bound === 'below'
          ? `You are ${comparative.less} than more than 99% of American ${group} aged ${age}.`
          : `You are ${comparative.more} than ${rounded}% of American ${group} aged ${age}.`;

    el('stat-you').textContent = format(value, unit);
    el('stat-median').textContent = format(found.median, unit);
    el('stat-diff').textContent = formatDifference(value - found.median, unit);
    el('chart-caption').textContent =
      `Distribution among American ${group} aged ${age}, based on ${found.n} effective survey respondents.`;

    drawChart(table.sex[sex].byAge[String(age)].p, value, unit);
    result.classList.add('visible');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function drawChart(quantiles, marker, unit) {
    const svg = el('result-chart');
    const W = 640, H = 220, pad = { l: 8, r: 8, t: 12, b: 34 };
    const points = densityFromQuantiles(quantiles);
    if (points.length === 0) return;

    const lo = quantiles[0];
    const hi = quantiles[quantiles.length - 1];
    const maxDensity = Math.max(...points.map((p) => p.density));
    const x = (v) => pad.l + ((v - lo) / (hi - lo)) * (W - pad.l - pad.r);
    const y = (d) => H - pad.b - (d / maxDensity) * (H - pad.t - pad.b);

    const area = [
      `M ${x(lo).toFixed(1)} ${(H - pad.b).toFixed(1)}`,
      ...points.map((p) => `L ${x(p.value).toFixed(1)} ${y(p.density).toFixed(1)}`),
      `L ${x(hi).toFixed(1)} ${(H - pad.b).toFixed(1)}`,
      'Z',
    ].join(' ');

    const clamped = Math.min(Math.max(marker, lo), hi);
    const ticks = [quantiles[9], quantiles[49], quantiles[89]];

    svg.innerHTML = `
      <title>Distribution for your age and sex, with your own value marked</title>
      <path d="${area}" fill="var(--data-soft)" stroke="var(--data)" stroke-width="2" />
      ${ticks.map((t) => `
        <line x1="${x(t).toFixed(1)}" y1="${pad.t}" x2="${x(t).toFixed(1)}" y2="${H - pad.b}"
              stroke="var(--line)" stroke-width="1" stroke-dasharray="3 3" />
        <text x="${x(t).toFixed(1)}" y="${H - 14}" text-anchor="middle"
              font-size="12" fill="var(--ink-soft)">${format(t, unit)}</text>`).join('')}
      <line x1="${x(clamped).toFixed(1)}" y1="${pad.t}" x2="${x(clamped).toFixed(1)}" y2="${H - pad.b}"
            stroke="var(--accent)" stroke-width="3" />
      <circle cx="${x(clamped).toFixed(1)}" cy="${pad.t}" r="5" fill="var(--accent)" />
      <text x="${x(clamped).toFixed(1)}" y="${pad.t - 2}" text-anchor="middle"
            font-size="12" font-weight="700" fill="var(--accent)">you</text>`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    errorNote.hidden = true;

    const sex = form.querySelector('input[name="sex"]:checked').value;
    const age = Number(el('age').value);
    const value = readValue(unitOf());

    if (!Number.isInteger(age) || age < 20 || age > 79) {
      return fail('Enter an age between 20 and 79. Our data does not cover ages outside that range.');
    }
    if (value === null || value < valueRange.min || value > valueRange.max) {
      return fail(valueRange.message);
    }

    render(sex, age, value);
    track(EVENTS.valueSubmitted, { metric, unit: unitOf() });
  });

  const shareButton = el('share-button');
  shareButton?.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({
      sex: form.querySelector('input[name="sex"]:checked').value,
      age: el('age').value,
      [shareParam]: readValue(unitOf()).toFixed(1),
      unit: unitOf(),
    }).toString();

    try {
      await navigator.clipboard.writeText(url.href);
      shareButton.textContent = 'Link copied';
      track(EVENTS.resultShared, { metric, method: 'clipboard' });
    } catch {
      window.prompt('Copy this link:', url.href);
    }
  });

  const cta = el('cta-next');
  cta?.addEventListener('click', () => {
    track(EVENTS.secondMetricOpened, { from: metric, to: cta.dataset.next });
  });

  // Een gedeelde link vult het formulier en toont het resultaat meteen.
  const params = new URLSearchParams(window.location.search);
  if (params.has(shareParam) && params.has('age')) {
    const sex = params.get('sex') === 'female' ? 'female' : 'male';
    const unit = params.get('unit') === 'metric' ? 'metric' : 'imperial';
    form.querySelector(`input[name="sex"][value="${sex}"]`).checked = true;
    form.querySelector(`input[name="unit"][value="${unit}"]`).checked = true;
    el('age').value = params.get('age');

    const age = Number(params.get('age'));
    const value = Number(params.get(shareParam));
    if (age >= 20 && age <= 79 && value >= valueRange.min && value <= valueRange.max) {
      writeValue(unit, value);
      el('input-imperial').hidden = unit !== 'imperial';
      el('input-metric').hidden = unit === 'imperial';
      render(sex, age, value);
    }
  }
}
