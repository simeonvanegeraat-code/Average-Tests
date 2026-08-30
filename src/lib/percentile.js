/**
 * Opzoeken in de percentieltabellen die scripts/build-percentiles.mjs produceert.
 *
 * De tabel bevat per geslacht en leeftijdsjaar de waarde bij percentiel 1 t/m 99.
 * Index 0 is percentiel 1, index 98 is percentiel 99.
 */

/**
 * Waar staat `value` in de verdeling voor deze groep?
 * Geeft `null` als de groep niet in de tabel zit (leeftijd buiten 20-79).
 */
export function lookupPercentile(table, sex, age, value) {
  const cell = table.sex[sex]?.byAge[String(age)];
  if (!cell) return null;

  const p = cell.p;
  const lowest = p[0];
  const highest = p[p.length - 1];

  // Buiten het getabelleerde bereik doen we geen alsof-precisie: we zeggen
  // "onder de 1e" of "boven de 99e" in plaats van een verzonnen getal.
  if (value <= lowest) return { percentile: 1, bound: 'below', median: p[49], n: cell.n };
  if (value >= highest) return { percentile: 99, bound: 'above', median: p[49], n: cell.n };

  let i = 1;
  while (i < p.length && p[i] <= value) i++;

  const lo = p[i - 1];
  const hi = p[i];
  const fraction = hi > lo ? (value - lo) / (hi - lo) : 0;

  return { percentile: i + fraction, bound: null, median: p[49], n: cell.n };
}

/**
 * Ruwe dichtheid uit de percentieltabel: tussen twee opeenvolgende percentielen
 * zit per definitie 1% van de groep, dus de dichtheid is 1 gedeeld door de
 * afstand. Dat is geen aparte schatting, alleen een andere weergave van dezelfde
 * getallen.
 */
export function densityFromQuantiles(quantiles) {
  const points = [];
  for (let i = 1; i < quantiles.length; i++) {
    const width = quantiles[i] - quantiles[i - 1];
    if (width <= 0) continue;
    points.push({ value: (quantiles[i] + quantiles[i - 1]) / 2, density: 1 / width });
  }
  return points;
}

/* --- eenheden ------------------------------------------------------------- */

export const CM_PER_INCH = 2.54;
export const LB_PER_KG = 2.2046226218;

export const toInches = (cm) => cm / CM_PER_INCH;
export const fromInches = (inches) => inches * CM_PER_INCH;
export const toPounds = (kg) => kg * LB_PER_KG;
export const fromPounds = (lb) => lb / LB_PER_KG;

/** 175.3 cm -> { feet: 5, inches: 9 } */
export function cmToFeetInches(cm) {
  const totalInches = Math.round(toInches(cm));
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function formatHeight(cm, unit) {
  if (unit === 'metric') return `${cm.toFixed(1)} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
}

export function formatWeight(kg, unit) {
  return unit === 'metric' ? `${kg.toFixed(1)} kg` : `${Math.round(toPounds(kg))} lb`;
}

/**
 * Een verschil is geen lengte: "+0'2\"" leest niemand. Voet-en-duim is voor een
 * absolute maat, een verschil hoort in één eenheid.
 */
export function formatHeightDifference(cm, unit) {
  const sign = cm < 0 ? '−' : '+';
  const abs = Math.abs(cm);
  if (unit === 'metric') return `${sign}${abs.toFixed(1)} cm`;
  const inches = Math.round(toInches(abs));
  return `${sign}${inches} ${inches === 1 ? 'inch' : 'inches'}`;
}

/**
 * Percentiel als tekst. Bewust geen decimalen bij een percentiel: de onderliggende
 * steekproef draagt die precisie niet.
 */
export function formatPercentile(result) {
  if (result.bound === 'below') return 'below the 1st';
  if (result.bound === 'above') return 'above the 99th';
  return `${Math.round(result.percentile)}`;
}

const ORDINALS = ['th', 'st', 'nd', 'rd'];
export function ordinal(n) {
  const v = n % 100;
  return n + (ORDINALS[(v - 20) % 10] || ORDINALS[v] || ORDINALS[0]);
}
