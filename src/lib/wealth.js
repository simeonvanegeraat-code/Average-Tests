/**
 * Plaatsing van een bezoeker in de vermogensverdeling.
 *
 * WAT WE WEL EN NIET MOGEN ZEGGEN — lees dit voordat je hier iets aan verandert.
 *
 * De ECB publiceert per groep het GEMIDDELDE, niet de GRENS. We weten dus wat het
 * zevende deciel gemiddeld bezit, maar niet waar het zevende deciel begint. Een
 * uitspraak als "je zit op het 63e percentiel" is daarom niet te onderbouwen en
 * staat nergens in deze code.
 *
 * Wat wel exact is: de mediaan. Die publiceert DWA per land. Daarom draait alles
 * hier op twee eerlijke uitspraken:
 *   1. sta je boven of onder de mediaan, en met hoeveel
 *   2. tussen welke twee groepsgemiddelden valt je bedrag
 */

/** Kwintielen vormen een volledige verdeling van alle huishoudens; decielen alleen de bovenhelft. */
const LADDER = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];

export function placeAmount(country, amount) {
  const median = country.median;
  const byCode = Object.fromEntries(country.groups.map((g) => [g.code, g]));
  const rungs = LADDER.map((c) => byCode[c]).filter(Boolean);

  let below = null;
  let above = null;
  for (const rung of rungs) {
    if (rung.netWealth <= amount) below = rung;
    else if (above === null) above = rung;
  }

  return {
    amount,
    median,
    aboveMedian: amount >= median,
    // Verhouding tot de mediaan: exact, want de mediaan is exact gepubliceerd.
    timesMedian: median > 0 ? amount / median : null,
    differenceFromMedian: amount - median,
    below,
    above,
    // Waarschuwing voor de bovenkant: boven het gemiddelde van de top 20% zegt
    // deze indeling niets meer, want daarbinnen loopt het extreem uiteen.
    beyondLadder: rungs.length > 0 && amount > rungs[rungs.length - 1].netWealth,
  };
}

/** In hoeveel landen ligt dit bedrag boven de mediaan? Volledig exact. */
export function rankAcrossCountries(countries, amount) {
  const scored = countries
    .map((c) => ({ ...c, aboveMedian: amount >= c.median, ratio: amount / c.median }))
    .sort((a, b) => a.median - b.median);

  return {
    aboveIn: scored.filter((c) => c.aboveMedian).length,
    total: scored.length,
    countries: scored,
  };
}

/* --- opmaak ---------------------------------------------------------------- */

export function euro(value, { compact = false } = {}) {
  if (value == null || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  if (compact && Math.abs(rounded) >= 1000) {
    const thousands = Math.round(Math.abs(rounded) / 1000);
    return `${rounded < 0 ? '−' : ''}€${thousands.toLocaleString('en-US')}k`;
  }
  const formatted = Math.abs(rounded).toLocaleString('en-US');
  return `${rounded < 0 ? '−' : ''}€${formatted}`;
}

export function multiple(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value >= 10) return `${Math.round(value)}×`;
  return `${value.toFixed(1)}×`;
}

export function percentChange(from, to) {
  if (!from || !to) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

/**
 * Landen die in het Engels een lidwoord krijgen. Zonder dit staat er "in
 * Netherlands", en dat leest als een vertaalfout — wat het ook is.
 */
const NEEDS_ARTICLE = new Set(['Netherlands']);

export function withArticle(name, { capitalise = false } = {}) {
  if (!NEEDS_ARTICLE.has(name)) return name;
  return `${capitalise ? 'The' : 'the'} ${name}`;
}

/** "half of the Netherlands" leest raar; "half of Dutch households" niet. */
export function possessive(name) {
  return NEEDS_ARTICLE.has(name) ? `the ${name}'s` : `${name}'s`;
}

/** "2025-Q4" -> "Q4 2025" */
export function formatPeriod(period) {
  if (!period) return '';
  const [year, quarter] = period.split('-');
  return `${quarter} ${year}`;
}
