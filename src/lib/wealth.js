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

import { decimal, grouped } from './format.js';

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

/**
 * Hier stond `toLocaleString('en-US')`, drie keer. Dat die taal er expliciet stond,
 * is goed gedaan: zonder argument volgt de opmaak de taal van de machine die bouwt,
 * en Vercel bouwt niet op dezelfde machine als wij. Dan schrijft dezelfde code hier
 * €1.053.910 en daar €1,053,910 — en geen enkele poort merkt dat, want de data is
 * goed en alleen de notatie verschuift.
 *
 * Nu komt de taal van de pagina in plaats van een vaste taal. Het euroteken blijft
 * ervoor staan in plaats van via `style: 'currency'` te gaan: dat zou in het Engels
 * €1,053,910 houden maar er in het Nederlands 1.053.910 € van maken, en de plaats
 * van het teken is een ontwerpkeuze van deze site, geen taalkwestie.
 */
export function euro(value, { compact = false, locale } = {}) {
  if (value == null || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  if (compact && Math.abs(rounded) >= 1000) {
    const thousands = Math.round(Math.abs(rounded) / 1000);
    return `${rounded < 0 ? '−' : ''}€${grouped(thousands, { locale })}k`;
  }
  return `${rounded < 0 ? '−' : ''}€${grouped(Math.abs(rounded), { locale })}`;
}

/**
 * Boven de tien geen decimaal, eronder één: "12×", "1.6×".
 *
 * Zonder duizendscheiding, ook boven de duizend. Dit getal komt uit een bedrag dat
 * een bezoeker zelf intypt, dus het kan groot worden, en "1,500×" zou een wijziging
 * zijn die geen enkele build laat zien — dit draait in de browser.
 */
export function multiple(value, { locale } = {}) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value >= 10) return `${decimal(value, 0, { locale })}×`;
  return `${decimal(value, 1, { locale })}×`;
}

export function percentChange(from, to) {
  if (!from || !to) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

/**
 * Lidwoord en bezitsvorm staan in grammar.js, samen met die van metric.js. Hier
 * stond een eigen `NEEDS_ARTICLE` met alleen Nederland erin: twee lijsten die van
 * elkaar konden afwijken, en dat deden ze ook.
 */
export { withArticle, possessive } from './grammar.js';

/** "2025-Q4" -> "Q4 2025" */
export function formatPeriod(period) {
  if (!period) return '';
  const [year, quarter] = period.split('-');
  return `${quarter} ${year}`;
}
