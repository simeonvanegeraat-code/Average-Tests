/**
 * Alles wat van de taal van de zin afhangt, en niets anders.
 *
 * Lidwoorden, meervouden en rangtelwoorden zijn geen eigenschap van een dataset maar
 * van de taal waarin de zin staat. Ze stonden daarom op twee verkeerde plekken: in
 * metric.js (de Eurostat-motor) en in wealth.js (de ECB-plaatsing), met in beide een
 * eigen `NEEDS_ARTICLE`. Dat zijn twee lijsten die uiteen kunnen lopen, en dat deden
 * ze ook: metric.js kende het Verenigd Koninkrijk, wealth.js niet.
 *
 * Die twee lijsten zijn hier één geworden. Dat kon zonder dat er een zin verandert,
 * want de ECB-reeks dekt 21 landen van de eurozone en het Verenigd Koninkrijk zit
 * daar niet bij — `withArticle()` en `possessive()` kregen die naam in wealth.js dus
 * nooit te zien. Nagekeken op 1 november 2026 tegen data/wealth/index.json.
 *
 * Waarom nu: zodra er een tweede taal bij komt, is dít de laag die per taal verschilt.
 * Het plan staat in research/i18n-plan.md. Aan het gedrag verandert hier niets; dit
 * bestand bestaat zodat er één plek is om straks te verbouwen in plaats van twee die
 * van elkaar niet weten.
 *
 * Engels, voorlopig. Wie hier een taal bij zet, geeft deze functies een argument —
 * geen tweede kopie van dit bestand. Let bij het Duits op naamval: "in Deutschland"
 * tegenover "in den Niederlanden". Een lijst namen is daar niet genoeg.
 */

/**
 * Landen die in het Engels een lidwoord krijgen. Zonder dit staat er "in Netherlands",
 * en dat leest als een vertaalfout — wat het ook is.
 */
const NEEDS_ARTICLE = new Set(['Netherlands', 'United Kingdom']);

export function withArticle(name, { capitalise = false } = {}) {
  if (!NEEDS_ARTICLE.has(name)) return name;
  return `${capitalise ? 'The' : 'the'} ${name}`;
}

/** "half of the Netherlands" leest raar; "half of Dutch households" niet. */
export function possessive(name) {
  return NEEDS_ARTICLE.has(name) ? `the ${name}'s` : `${name}'s`;
}

export function count(n, singular, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st. */
export function ordinal(n) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
}
