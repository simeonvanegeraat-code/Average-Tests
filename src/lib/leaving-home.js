/**
 * Rekenwerk en formattering voor de pagina "leaving home".
 *
 * Alles wat op de pagina als tekst verschijnt wordt hier uit de data berekend.
 * Er staat geen cijfer in een zin op de pagina zelf; dat is de enige manier om te
 * voorkomen dat een handgetypt getal achterblijft als Eurostat bijpubliceert.
 *
 * Twee dingen die de hele pagina bepalen:
 *
 * 1. Dit is geen gemiddelde. Eurostat labelt de dataset als "estimated average
 *    age", maar de eigen definitie zegt: de leeftijd waarop 50% van de bevolking
 *    niet meer bij de ouders woont. Dat is een middelpunt, geen gemiddelde. De
 *    pagina gebruikt de definitie, niet het label.
 *
 * 2. Het is geen verdeling. We weten alleen waar dat middelpunt ligt, niet hoe de
 *    leeftijden eromheen gespreid zijn. Er is dus geen percentiel uit te rekenen
 *    en geen functie hier doet alsof dat kan. Het sterkste eerlijke antwoord is:
 *    lag jouw leeftijd voor of na het middelpunt van je land.
 */

/**
 * "half of Netherlands" leest als een vertaalfout, want dat is het ook.
 *
 * `src/lib/wealth.js` heeft een eigen versie hiervan met alleen Nederland erin.
 * Bewust niet samengevoegd: elke module draagt de namen die in zijn eigen dataset
 * voorkomen. Komt er een derde, dan is het tijd voor één gedeelde namenmodule.
 */
const NEEDS_ARTICLE = new Set(['Netherlands', 'United Kingdom']);

export function withArticle(name, { capitalise = false } = {}) {
  if (!NEEDS_ARTICLE.has(name)) return name;
  return `${capitalise ? 'The' : 'the'} ${name}`;
}

/** Eén decimaal, want zo publiceert Eurostat het ook. */
export function age(value) {
  return value === null || value === undefined ? '—' : value.toFixed(1);
}

export function years(value, { sign = false } = {}) {
  const rounded = Math.abs(value).toFixed(1);
  const unit = rounded === '1.0' ? 'year' : 'years';
  const prefix = sign && value > 0 ? '+' : sign && value < 0 ? '−' : '';
  return `${prefix}${rounded} ${unit}`;
}

export function count(n, singular, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
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

export function euAggregate(index) {
  return index.aggregates.find((aggregate) => aggregate.code === 'EU27_2020') ?? null;
}

export function ranked(index) {
  return [...currentCountries(index)].sort((a, b) => a.total - b.total);
}

/**
 * De kerncijfers voor de kop: het EU-cijfer en de twee uitersten, berekend over
 * één jaar zodat de kloof een echte vergelijking is.
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
 * Vrouwen vertrekken eerder dan mannen. Dat is geen aanname maar een uitkomst,
 * dus we tellen het en noemen ook de landen waar het niet opgaat.
 */
export function genderGap(index) {
  const withBoth = currentCountries(index).filter((c) => c.men !== null && c.women !== null);
  if (withBoth.length === 0) return null;

  const gapOf = (country) => country.men - country.women;
  const womenEarlier = withBoth.filter((country) => gapOf(country) > 0);
  const exceptions = withBoth.filter((country) => gapOf(country) <= 0);
  const mean = withBoth.reduce((sum, country) => sum + gapOf(country), 0) / withBoth.length;
  const widest = [...withBoth].sort((a, b) => gapOf(b) - gapOf(a))[0];

  return {
    of: withBoth.length,
    womenEarlier: womenEarlier.length,
    exceptions,
    mean,
    widest,
    widestGap: gapOf(widest),
  };
}

/**
 * De beweging door de tijd, maar alleen binnen het venster dat Eurostat zelf
 * vergelijkbaar maakt.
 *
 * `index.comparableSince` is het eerste jaar ná de laatste reeksbreuk. Vóór dat
 * jaar is de Labour Force Survey anders ingericht en zijn de cijfers niet met nu
 * te vergelijken: Portugal staat in het breukjaar op 33,3 en het jaar erna op
 * 30,1, Zweden springt van 17,5 naar 22,0. Een vergelijking met 2005 levert
 * daardoor een getal dat echt lijkt en niets betekent. Die rekenen we dus niet uit.
 *
 * Geeft null als het venster te smal is of als er alsnog een breuk in zit.
 */
export function trend(index, { minimumMove = 0.5 } = {}) {
  const since = index.comparableSince;
  const until = index.latestYear;
  if (!since || since >= until) return null;

  const withBoth = currentCountries(index).filter(
    (country) => country.series[since] !== undefined && country.series[until] !== undefined,
  );
  if (withBoth.length < 2) return null;

  // Een breuk binnen het venster mag niet voorkomen. Komt hij er toch, dan
  // rekenen we niets uit in plaats van een voorbehoud onder een grafiek te zetten.
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
 * Geen percentiel. Wat de dataset geeft is het middelpunt: de leeftijd waarop de
 * helft van een land niet meer thuis woont. Daarmee kun je eerlijk zeggen of
 * iemand vóór of ná dat middelpunt vertrok, en bij hoeveel landen dat zo is.
 */
export function comparison(index, { code, age: own }) {
  const current = currentCountries(index);
  const home = index.countries.find((country) => country.code === code) ?? null;
  const beforeMidpoint = current.filter((country) => own < country.total);
  const closest = [...current].sort(
    (a, b) => Math.abs(a.total - own) - Math.abs(b.total - own),
  )[0];

  return {
    own,
    home,
    difference: home ? own - home.total : null,
    beforeMidpoint: beforeMidpoint.length,
    of: current.length,
    closest,
    year: index.latestYear,
  };
}

/**
 * Zes vaste stappen in plaats van kwantielen: de legenda blijft dan hetzelfde als
 * de data bijwerkt, en een kaart waarvan de klassegrenzen elk jaar schuiven is
 * niet te vergelijken met de kaart van vorig jaar.
 *
 * Deze grenzen staan ook in src/components/CountryMap.astro, in de client-side
 * lens. Verander je ze hier, verander ze daar dan ook.
 */
export const BANDS = [
  { until: 22, label: 'under 22' },
  { until: 24, label: '22 to 24' },
  { until: 26, label: '24 to 26' },
  { until: 28, label: '26 to 28' },
  { until: 30, label: '28 to 30' },
  { until: Infinity, label: '30 and over' },
];

export function band(value) {
  if (value === null || value === undefined) return -1;
  return BANDS.findIndex((bucket) => value < bucket.until);
}
