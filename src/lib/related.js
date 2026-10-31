/**
 * Welke metriek hoort bij welke, en waarom — in één zin met echte cijfers.
 *
 * De audit van 26 oktober (research/seo-audit.md) vond dat van de negen
 * metriekpagina's er precies één naar een andere metriek linkte. Negen pagina's over
 * hetzelfde onderwerp die elkaar niet noemen zijn voor een lezer negen losse pagina's,
 * en voor Google ook.
 *
 * **Hoe de paren gekozen zijn.** Per paar is de samenhang over de landen heen
 * uitgerekend (Pearson). Die uitkomst staat hieronder in een opmerking en komt
 * nadrukkelijk **niet op de pagina**: het is een verband tussen landen, niet tussen
 * mensen, en een r van 0,77 op een pagina nodigt uit tot een oorzakelijke lezing die
 * het cijfer niet draagt. De correlatie kiest het paar; de zin die de lezer krijgt
 * bevat alleen gepubliceerde cijfers van landen met naam, die hij in de tabel ernaast
 * kan terugvinden.
 *
 * Alleen op de server: dit importeert negen JSON-bestanden.
 */
import { currentCountries, formatValue, withArticle } from './metric.js';
import { euro } from './wealth.js';

import leavingHome from './metrics/leaving-home.js';
import householdSize from './metrics/household-size.js';
import dwellingSize from './metrics/dwelling-size.js';
import workingLife from './metrics/working-life.js';
import workingHours from './metrics/working-hours.js';
import pensionAge from './metrics/pension-age.js';
import unemployment from './metrics/unemployment.js';
import healthyYears from './metrics/healthy-years.js';
import firstChild from './metrics/first-child.js';

import leavingHomeData from '../../data/leaving-home/index.json';
import householdSizeData from '../../data/household-size/index.json';
import dwellingSizeData from '../../data/dwelling-size/index.json';
import workingLifeData from '../../data/working-life/index.json';
import workingHoursData from '../../data/working-hours/index.json';
import pensionAgeData from '../../data/pension-age/index.json';
import unemploymentData from '../../data/unemployment/index.json';
import healthyYearsData from '../../data/healthy-years/index.json';
import firstChildData from '../../data/first-child/index.json';
import wealthData from '../../data/wealth/index.json';

const METRICS = {
  'leaving-home': { metric: leavingHome, index: leavingHomeData },
  'household-size': { metric: householdSize, index: householdSizeData },
  'dwelling-size': { metric: dwellingSize, index: dwellingSizeData },
  'working-life': { metric: workingLife, index: workingLifeData },
  'working-hours': { metric: workingHours, index: workingHoursData },
  'pension-age': { metric: pensionAge, index: pensionAgeData },
  unemployment: { metric: unemployment, index: unemploymentData },
  'healthy-years': { metric: healthyYears, index: healthyYearsData },
  'first-child': { metric: firstChild, index: firstChildData },
};

/** Vermogen heeft een andere vorm; zie wealthEntry() in catalogue.js. */
const WEALTH = {
  key: 'wealth',
  label: 'Wealth',
  path: '/wealth/',
  values: new Map(
    wealthData.countries
      .filter((country) => typeof country.median === 'number')
      // Eurostat schrijft EL waar de ECB GR schrijft.
      .map((country) => [country.area === 'GR' ? 'EL' : country.area, { value: country.median, name: country.name }]),
  ),
  show: (value) => euro(value, { compact: true }),
};

const valuesOf = (key) =>
  key === 'wealth'
    ? WEALTH.values
    : new Map(currentCountries(METRICS[key].index).map((country) => [country.code, { value: country.total, name: country.name }]));

const show = (key, value) => (key === 'wealth' ? WEALTH.show(value) : formatValue(value, METRICS[key].metric));
const label = (key) => (key === 'wealth' ? WEALTH.label : METRICS[key].metric.label);
const path = (key) => (key === 'wealth' ? WEALTH.path : METRICS[key].metric.path);

/**
 * De twee uiterste landen van `from`, met hun cijfer in `to` ernaast — alleen landen
 * die in allebei staan, want anders vergelijk je twee verschillende verzamelingen.
 */
function ends(from, to) {
  const left = valuesOf(from);
  const right = valuesOf(to);
  const rows = [];
  for (const [code, a] of left) {
    const b = right.get(code);
    if (b) rows.push({ code, name: a.name, from: a.value, to: b.value });
  }
  if (rows.length < 8) return null;
  rows.sort((a, b) => a.from - b.from);
  return { of: rows.length, low: rows[0], high: rows[rows.length - 1] };
}

/**
 * Hoe vaak de waarde van `a` ónder die van `b` ligt, over de landen die beide hebben.
 *
 * De richting is het hele punt en moet daarom per zin uitgeschreven worden, niet
 * afgeleid van op welke pagina je staat. Toen dat wel gebeurde stond er op
 * /pension-age/ "in 21 van de 28 landen raken de gezonde jaren op voor het pensioen
 * begint" — het zijn er zeven, en Italië werd als het ergste geval genoemd terwijl het
 * juist het ruimste is.
 */
function crossings(a, b) {
  const left = valuesOf(a);
  const right = valuesOf(b);
  const rows = [];
  for (const [code, x] of left) {
    const y = right.get(code);
    if (y) rows.push({ code, name: x.name, a: x.value, b: y.value, gap: x.value - y.value });
  }
  rows.sort((p, q) => p.gap - q.gap);
  return { of: rows.length, under: rows.filter((r) => r.gap < 0).length, widest: rows[0], rows };
}

/**
 * Per metriek twee buren. De `r` in de opmerking is waarom dit paar gekozen is; hij
 * staat niet in de zin die de lezer leest.
 */
const NEIGHBOURS = {
  'leaving-home': [
    // r = 0,77 over 29 landen
    ['household-size', (e) =>
      `Where people leave latest, households are fullest: ${withArticle(e.high.name, { capitalise: true })} at ${show('leaving-home', e.high.from)} ` +
      `has ${show('household-size', e.high.to)} people per household, against ${show('household-size', e.low.to)} in ` +
      `${e.low.name}, where half have left by ${show('leaving-home', e.low.from)}.`],
    // r = −0,73 over 30 landen
    ['working-life', (e) =>
      `Leaving late does not mean working less: ${withArticle(e.low.name, { capitalise: true })} combines the earliest exit from home ` +
      `(${show('leaving-home', e.low.from)}) with ${show('working-life', e.low.to)} years in the labour market, while ` +
      `${e.high.name} pairs ${show('leaving-home', e.high.from)} with ${show('working-life', e.high.to)}.`],
  ],

  'household-size': [
    // De eigen berekening op /dwelling-size/ gaat precies over dit paar.
    ['dwelling-size', (e) =>
      `A household of ${show('household-size', e.high.from)} in ${e.high.name} has ${show('dwelling-size', e.high.to)} m² ` +
      `to share; one of ${show('household-size', e.low.from)} in ${e.low.name} has ${show('dwelling-size', e.low.to)} m². ` +
      `That page divides the one by the other.`],
    // r = 0,77 over 29 landen
    ['leaving-home', (e) =>
      `Big households and late departures travel together: ${e.high.name} has ${show('household-size', e.high.from)} ` +
      `people per household and half of young people still at home until ${show('leaving-home', e.high.to)}.`],
  ],

  'dwelling-size': [
    ['household-size', (e) =>
      `Floor space says little until you know how many people share it: ${e.high.name} has the largest homes at ` +
      `${show('dwelling-size', e.high.from)} m² and ${show('household-size', e.high.to)} people in them.`],
    // r = 0,70 over 20 landen
    ['wealth', (e) =>
      `Property is the largest holding of most European households, and it shows: ${e.high.name} pairs ` +
      `${show('dwelling-size', e.high.from)} m² with a median household worth ${show('wealth', e.high.to)}, against ` +
      `${show('dwelling-size', e.low.from)} m² and ${show('wealth', e.low.to)} in ${e.low.name}.`],
    // r = 0,51 over 32 landen. Deze staat hier omdat first-child anders de enige
    // metriek is waar geen enkele andere pagina naar verwijst.
    ['first-child', (e) =>
      `Bigger homes and later first children sit on the same side of Europe: ${e.high.name} averages ` +
      `${show('dwelling-size', e.high.from)} m² and a first child at ${show('first-child', e.high.to)}, against ` +
      `${show('dwelling-size', e.low.from)} m² and ${show('first-child', e.low.to)} in ${e.low.name}.`],
  ],

  'working-life': [
    // r = −0,69 over 32 landen
    ['working-hours', (e) =>
      `The longest career has the shortest week: ${withArticle(e.high.name)} expects ${show('working-life', e.high.from)} ` +
      `years in work at ${show('working-hours', e.high.to)} hours, while ${withArticle(e.low.name)} expects ` +
      `${show('working-life', e.low.from)} years at ${show('working-hours', e.low.to)}.`],
    // r = 0,74 over 29 landen
    ['pension-age', (e) =>
      `A long working life and a late pension go together: ${withArticle(e.high.name)} has ${show('working-life', e.high.from)} ` +
      `years in the labour market and a pension that starts at ${show('pension-age', e.high.to)}; ${e.low.name} has ` +
      `${show('working-life', e.low.from)} years and ${show('pension-age', e.low.to)}.`],
  ],

  'working-hours': [
    // r = −0,69 over 32 landen
    ['working-life', (e) =>
      `Short weeks do not mean short careers. ${withArticle(e.low.name, { capitalise: true })} works ${show('working-hours', e.low.from)} hours ` +
      `and still expects ${show('working-life', e.low.to)} years in the labour market — more than ${e.high.name}, ` +
      `where the week runs ${show('working-hours', e.high.from)} hours.`],
    // r = 0,64 over 31 landen
    ['leaving-home', (e) =>
      `The countries with the longest weeks are also the ones where people leave home latest: ${e.high.name} at ` +
      `${show('working-hours', e.high.from)} hours and ${show('leaving-home', e.high.to)}.`],
  ],

  /**
   * Werkloosheid is de eerste metriek waar de correlatie géén paar aanwijst. Tegen alle
   * acht andere is het verband nul: het sterkste is −0,27 (huishoudgrootte) en de rest
   * ligt tussen −0,18 en 0,12. Tegen thuis wonen, waar iedereen een verband verwacht,
   * is het −0,05 over 29 landen.
   *
   * Deze twee buren staan er dus om wat ze inhoudelijk met werkloosheid te maken hebben,
   * en de zin zegt in beide gevallen dat er geen patroon is in plaats van er een te
   * suggereren. Dat is geen zwakke link maar de meest bruikbare die deze data toelaat.
   */
  unemployment: [
    // r = −0,05 over 29 landen: de verwachting is sterk, het verband bestaat niet.
    ['leaving-home', (pair, cross) => {
      const byAge = [...cross.rows].sort((a, b) => a.b - b.b);
      const early = byAge[0];
      const late = byAge[byAge.length - 1];
      return (
        `A hard job market is supposed to keep young people at home, and across these ${cross.of} ` +
        `countries it does not show up at all. ${withArticle(early.name, { capitalise: true })} has the ` +
        `earliest departure in Europe, ${show('leaving-home', early.b)}, with ` +
        `${show('unemployment', early.a)}% unemployment; ${late.name} has the latest, ` +
        `${show('leaving-home', late.b)}, with ${show('unemployment', late.a)}%.`
      );
    }],
    // r = −0,13 over 29 landen. Dit paar staat er om de definitie, niet om een patroon.
    ['working-life', (pair, cross) => {
      /**
       * Niet de uitersten van werkloosheid, want die zouden hier een patroon suggereren
       * dat er niet is. Wel het scherpste tegenvoorbeeld, met een regel die altijd een
       * waar geval oplevert: van de landen met bovengemiddelde werkloosheid degene met
       * de langste verwachte loopbaan. Beide cijfers staan er; de vergelijking maakt de
       * lezer zelf, zodat de zin niet onwaar kan worden als de orde verschuift.
       */
      const byRate = [...cross.rows].sort((a, b) => a.a - b.a);
      const middle = byRate[Math.floor(byRate.length / 2)].a;
      const above = byRate.filter((row) => row.a >= middle);
      const counter = above.reduce((top, row) => (row.b > top.b ? row : top), above[0]);
      const lowest = byRate[0];
      return (
        `Looking for work still counts as being in the labour force, so a high rate here takes ` +
        `nothing off the working life behind it. ${withArticle(counter.name, { capitalise: true })} expects ` +
        `${show('working-life', counter.b)} years in the labour market at ${show('unemployment', counter.a)}% ` +
        `unemployment; ${withArticle(lowest.name)}, with the lowest rate here at ` +
        `${show('unemployment', lowest.a)}%, expects ${show('working-life', lowest.b)}.`
      );
    }],
  ],

  'pension-age': [
    ['healthy-years', () => {
      // Expliciet deze kant op: hoe vaak liggen de gezonde jaren ónder de pensioenleeftijd.
      const cross = crossings('healthy-years', 'pension-age');
      return (
        `In ${cross.under} of these ${cross.of} countries the healthy years run out before the pension starts. The ` +
        `widest gap is ${withArticle(cross.widest.name)}: ${show('healthy-years', cross.widest.a)} healthy years ` +
        `against a pension that begins at ${show('pension-age', cross.widest.b)}.`
      );
    }],
    // r = 0,74 over 29 landen
    ['working-life', (e) =>
      `The later the pension, the longer the working life behind it: ${withArticle(e.high.name)} starts at ` +
      `${show('pension-age', e.high.from)} after ${show('working-life', e.high.to)} years in work.`],
  ],

  'healthy-years': [
    ['pension-age', () => {
      const cross = crossings('healthy-years', 'pension-age');
      return (
        `Healthy years and pension age do not move together. In ${cross.under} of these ${cross.of} countries the ` +
        `healthy years end first — ${withArticle(cross.widest.name)} by ${show('healthy-years', Math.abs(cross.widest.gap))} years.`
      );
    }],
    ['working-life', (e) =>
      `${withArticle(e.high.name, { capitalise: true })} has the most healthy years (${show('healthy-years', e.high.from)}) and one of the ` +
      `shortest working lives (${show('working-life', e.high.to)} years); ${e.low.name} has the fewest ` +
      `(${show('healthy-years', e.low.from)}) and spends ${show('working-life', e.low.to)} years at work.`],
  ],

  'first-child': [
    ['leaving-home', () => {
      const cross = crossings('first-child', 'leaving-home');
      return (
        `In ${cross.under} of these ${cross.of} countries the first child arrives before the parental home is left. ` +
        `${withArticle(cross.widest.name, { capitalise: true })} is the furthest: a first child at ` +
        `${show('first-child', cross.widest.a)}, the midpoint for leaving home at ${show('leaving-home', cross.widest.b)}.`
      );
    }],
    // r = 0,51 over 32 landen
    ['dwelling-size', (e) =>
      `Later first children and larger homes sit on the same side of Europe: ${e.high.name} at ` +
      `${show('first-child', e.high.from)} and ${show('dwelling-size', e.high.to)} m².`],
  ],

  wealth: [
    // r = 0,70 over 20 landen
    ['dwelling-size', (e) =>
      `Most of that wealth is the home it is measured in: ${e.high.name}, with a median household worth ` +
      `${show('wealth', e.high.from)}, averages ${show('dwelling-size', e.high.to)} m² of floor space.`],
    ['household-size', (e) =>
      `Wealth is counted per household, so household size is part of the answer: ${e.high.name} has ` +
      `${show('household-size', e.high.to)} people behind its ${show('wealth', e.high.from)}, ${e.low.name} ` +
      `${show('household-size', e.low.to)} behind ${show('wealth', e.low.from)}.`],
  ],
};

/**
 * De buren van één metriek, met hun zin. Een paar waarvoor te weinig landen in beide
 * datasets zitten valt stil weg; liever een buur minder dan een zin over acht landen.
 */
export function related(key) {
  return (NEIGHBOURS[key] ?? [])
    .map(([to, line]) => {
      const pair = ends(key, to);
      if (!pair) return null;
      const cross = crossings(key, to);
      return { key: to, label: label(to), path: path(to), line: line(pair, cross), of: pair.of };
    })
    .filter(Boolean);
}

/**
 * Het artikel over de reeksbreuk, maar alleen op pagina's waar daadwerkelijk een breuk
 * ligt. Op /working-life/ of een dataset van één jaar zou het een voetnoot zijn bij een
 * probleem dat die pagina niet heeft.
 */
export function breakNote(key) {
  const index = METRICS[key]?.index;
  if (!index?.lastBreak) return null;

  /**
   * Niet op /unemployment/. Het artikel gaat over de herziening van de Labour Force
   * Survey in 2021, een gebeurtenis die vrijwel elke jaarreeks tegelijk brak. De breuken
   * in de maandreeks zijn iets anders: Malta in januari 2025 en Denemarken in oktober
   * 2023, elk op zichzelf. Een kaartje dat "lees waarom 2021 bijna elke reeks breekt"
   * belooft naast een vlag uit 2025 stuurt de lezer de verkeerde kant op, en die pagina
   * legt zijn eigen breuken al in de methodesectie uit.
   */
  if (key === 'unemployment') return null;
  return {
    path: '/notes/eurostat-2021-series-break/',
    year: index.lastBreak,
    of: currentCountries(index).filter((country) => country.breaks?.includes(index.lastBreak)).length,
    countries: currentCountries(index).length,
  };
}
