/**
 * De generieke motor onder elke metriekpagina.
 *
 * Elke dataset in deze repo wordt door zijn buildscript naar dezelfde vorm gebracht:
 *
 *   { source, latestYear, years[], lastBreak, comparableSince,
 *     countriesAtLatestYear, aggregates[], countries[] }
 *
 * met per land `{ code, name, year, total, men, women, breaks[], series{} }`. Alles
 * hieronder werkt op die vorm en weet niets van de metriek erachter — geen eenheid,
 * geen klassegrenzen, geen zinnen. Dat zit in de beschrijving per metriek, in
 * `src/lib/metrics/`.
 *
 * Deze scheiding bestaat omdat de componenten (StageMap, RankTable, StatHero en de
 * rest) eerst rechtstreeks uit `leaving-home.js` importeerden. Dat werkte voor één
 * pagina en zou bij de tweede tot kopiëren hebben geleid.
 */

/**
 * "half of Netherlands" leest als een vertaalfout, want dat is het ook.
 *
 * Dit stond eerder in zowel leaving-home.js als wealth.js, met de notitie dat het
 * bij een derde gebruiker tijd werd voor één gedeelde lijst. Dat moment is dit.
 */
const NEEDS_ARTICLE = new Set(['Netherlands', 'United Kingdom']);

export function withArticle(name, { capitalise = false } = {}) {
  if (!NEEDS_ARTICLE.has(name)) return name;
  return `${capitalise ? 'The' : 'the'} ${name}`;
}

export function count(n, singular, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Formattering als gegevens, niet als code.
 *
 * Dat lijkt omslachtig tegenover een functie per metriek, maar het is de enige vorm
 * die de browser kan bereiken. De componenten staan op de server én draaien een
 * script in de pagina; een functie kan niet door het JSON-blok dat de client leest,
 * een `{ decimals, unit, unitOne }` wel. Zo rekenen beide kanten met dezelfde
 * configuratie in plaats van met twee lijstjes die gelijk moeten blijven.
 *
 * leaving-home: `{ decimals: 1, unit: 'years', unitOne: 'year' }`
 * huishoudgrootte: `{ decimals: 2, unit: 'people', unitOne: 'person' }`
 */
export function formatValue(value, { decimals = 1 } = {}) {
  return value === null || value === undefined ? '—' : value.toFixed(decimals);
}

/** Een hoeveelheid mét eenheid: "10.2 years", "0.4 people", met optioneel teken. */
export function formatAmount(value, { decimals = 1, unit = '', unitOne = unit } = {}, { sign = false } = {}) {
  if (value === null || value === undefined) return '—';
  const rounded = Math.abs(value).toFixed(decimals);
  const word = Number(rounded) === 1 ? unitOne : unit;
  const prefix = sign && value > 0 ? '+' : sign && value < 0 ? '−' : '';
  return word ? `${prefix}${rounded} ${word}` : `${prefix}${rounded}`;
}

/** Ondertekend getal zonder eenheid: "+1.4", "−0.6", "0.0". */
export function signed(value, { decimals = 1 } = {}) {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(decimals)}`;
}

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st. */
export function ordinal(n) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
}

/** Alleen de landen die écht op het laatste jaar staan. */
export function currentCountries(index) {
  return index.countries.filter((country) => country.year === index.latestYear);
}

export function staleCountries(index) {
  return index.countries
    .filter((country) => country.year !== index.latestYear)
    .sort((a, b) => b.year.localeCompare(a.year));
}

export function euAggregate(index, code = 'EU27_2020') {
  return index.aggregates.find((aggregate) => aggregate.code === code) ?? null;
}

export function ranked(index) {
  return [...currentCountries(index)].sort((a, b) => a.total - b.total);
}

/**
 * De kerncijfers voor de kop: het EU-cijfer en de twee uitersten, berekend over
 * één jaar zodat de kloof een echte vergelijking is.
 *
 * `earliest` en `latest` zijn laag en hoog, niet vroeg en laat — bij een metriek
 * zonder tijdsbetekenis (huishoudgrootte) leest dat als kleinste en grootste.
 */
export function headline(index) {
  const current = ranked(index);
  const earliest = current[0];
  const latest = current[current.length - 1];

  return {
    eu: euAggregate(index),
    earliest,
    latest,
    gap: latest.total - earliest.total,
    countries: current.length,
    year: index.latestYear,
  };
}

/**
 * Waar het Europese cijfer ligt tussen het laagste en het hoogste land, als
 * percentage van die afstand. Bedoeld voor een balkje dat de positie toont zonder
 * de hele verdeling te beloven: het zegt alleen iets over de twee uitersten en het
 * aggregaat, en dat zijn alle drie gepubliceerde cijfers.
 *
 * Geeft null zodra één van de drie ontbreekt, of als alle landen gelijk zijn — dan
 * is er geen afstand om een positie in uit te drukken en zou elke waarde liegen.
 */
export function spread(index) {
  const { eu, earliest, latest } = headline(index);
  if (!eu || !earliest || !latest) return null;

  const distance = latest.total - earliest.total;
  if (distance <= 0) return null;

  return {
    low: earliest,
    high: latest,
    at: ((eu.total - earliest.total) / distance) * 100,
  };
}

/**
 * De uitsplitsing naar geslacht, waar de dataset die heeft. Geeft null als er geen
 * enkel land een splitsing levert, zodat een pagina de sectie gewoon weglaat in
 * plaats van lege cellen te tonen.
 *
 * De richting is niet ingebakken: `lower` telt de landen waar vrouwen het laagste
 * cijfer hebben. Of dat "eerder" of "minder" betekent, bepaalt de pagina.
 */
export function genderGap(index) {
  const withBoth = currentCountries(index).filter((c) => c.men !== null && c.women !== null);
  if (withBoth.length === 0) return null;

  const gapOf = (country) => country.men - country.women;
  const womenLower = withBoth.filter((country) => gapOf(country) > 0);
  const exceptions = withBoth.filter((country) => gapOf(country) <= 0);
  const mean = withBoth.reduce((sum, country) => sum + gapOf(country), 0) / withBoth.length;
  const widest = [...withBoth].sort((a, b) => gapOf(b) - gapOf(a))[0];

  return {
    of: withBoth.length,
    womenLower: womenLower.length,
    /** Oude naam uit de leaving-home-pagina; dezelfde telling. */
    womenEarlier: womenLower.length,
    exceptions,
    mean,
    widest,
    widestGap: gapOf(widest),
  };
}

/**
 * De beweging door de tijd, maar alleen binnen het venster dat de bron zelf
 * vergelijkbaar maakt.
 *
 * `index.comparableSince` is het eerste jaar ná de laatste reeksbreuk. Dat veld is
 * de reden dat deze functie bestaat: bij leaving-home groeit de kloof tussen landen
 * als je vanaf 2005 rekent en krimpt hij binnen het vergelijkbare venster. Een
 * voetnoot onder zo'n grafiek is niet genoeg, dus hier wordt niets uitgerekend.
 *
 * Geeft null als het venster te smal is of als er alsnog een breuk in valt. Bij
 * verschillende datasets gebeurt dat echt: de meeste Eurostat-reeksen hebben hun
 * laatste breuk in of vlak vóór het laatste jaar, en dan hoort een pagina geen
 * trendsectie te hebben.
 */
export function trend(index, { minimumMove = 0.5 } = {}) {
  const since = index.comparableSince;
  const until = index.latestYear;
  if (!since || since >= until) return null;

  const withBoth = currentCountries(index).filter(
    (country) => country.series[since] !== undefined && country.series[until] !== undefined,
  );
  if (withBoth.length < 2) return null;

  const spansBreak = (country) => country.breaks.some((year) => year > since && year <= until);
  if (withBoth.some(spansBreak)) return null;

  const rangeIn = (year) => {
    const values = withBoth.map((country) => country.series[year]);
    return Math.max(...values) - Math.min(...values);
  };

  const eu = euAggregate(index);
  const moved = withBoth
    .map((country) => ({ ...country, change: country.series[until] - country.series[since] }))
    .sort((a, b) => a.change - b.change);

  return {
    since,
    until,
    countries: withBoth.length,
    spreadThen: rangeIn(since),
    spreadNow: rangeIn(until),
    euThen: eu?.series[since] ?? null,
    euNow: eu?.series[until] ?? null,
    earlier: moved.filter((country) => country.change <= -minimumMove),
    later: moved.filter((country) => country.change >= minimumMove).reverse(),
    stable: moved.filter((country) => Math.abs(country.change) < minimumMove).length,
    minimumMove,
  };
}

/**
 * De persoonlijke laag.
 *
 * Nooit een percentiel. Wat deze bronnen geven is één cijfer per land; daarmee kun
 * je eerlijk zeggen aan welke kant daarvan iemand valt, en bij hoeveel landen dat
 * zo is. `below` telt de landen waarvan het cijfer hóger ligt dan de ingevoerde
 * waarde — bij leeftijd betekent dat "eerder dan", bij huishoudgrootte "kleiner
 * dan". Welk woord erbij hoort, bepaalt de pagina.
 */
export function comparison(index, { code, value }) {
  const current = currentCountries(index);
  const home = index.countries.find((country) => country.code === code) ?? null;
  const below = current.filter((country) => value < country.total);
  const closest = [...current].sort(
    (a, b) => Math.abs(a.total - value) - Math.abs(b.total - value),
  )[0];

  return {
    own: value,
    home,
    difference: home ? value - home.total : null,
    below: below.length,
    /** Oude naam uit de leaving-home-pagina; dezelfde telling. */
    beforeMidpoint: below.length,
    of: current.length,
    closest,
    year: index.latestYear,
  };
}

/**
 * Zes vaste stappen in plaats van kwantielen: de legenda blijft dan hetzelfde als
 * de data bijwerkt, en een kaart waarvan de klassegrenzen elk jaar schuiven is niet
 * te vergelijken met die van vorig jaar. De grenzen zelf horen bij de metriek.
 */
export function bandOf(value, bands) {
  if (value === null || value === undefined) return -1;
  // De bovengrens van de laatste klasse is Infinity, en JSON.stringify maakt daar
  // null van. Omdat de beschrijving via een JSON-blok de browser bereikt, moet een
  // ontbrekende bovengrens hier hetzelfde betekenen als een oneindige — anders valt
  // de hoogste klasse in de client buiten elke band.
  return bands.findIndex((bucket) => bucket.until === null || bucket.until === undefined || value < bucket.until);
}
