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
 * **De zinnen staan hier niet.** Die horen in src/locales/<taal>/copy/related.js, want
 * ze verschillen per taal; hier staat welke paren er zijn en wat er uitgerekend wordt.
 * Tot 3 november 2026 stonden ze wél hier, en dit bestand importeerde zijn negen
 * JSON-bestanden zonder ooit een taal aan te nemen — op een Nederlandse pagina stond
 * dus "Croatia at 31.5 has 2.6 people per household", met Engelse naam én Engels getal.
 *
 * Alleen op de server: dit importeert negen JSON-bestanden.
 */
import { currentCountries, formatValue } from './metric.js';
import { euro } from './wealth.js';
import { DEFAULT_LOCALE } from './locales.js';
import { localise } from './country-names.js';
import { localiseMetric } from './metric-names.js';
import { grammarOf } from './grammar.js';
import { ui } from './ui.js';

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

import enCopy from '../locales/en/copy/related.js';
import nlCopy from '../locales/nl/copy/related.js';

/** De zinnen per taal, net als bij de kaart. De poort vergelijkt deze sleutels met LOCALES. */
const COPY = { en: enCopy, nl: nlCopy };

/** Welke talen hier zinnen hebben. Alleen voor de poort. */
export const COPY_LANGUAGES = Object.keys(COPY);

const RAW = {
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

/**
 * Per metriek twee buren. De `r` in de opmerking is waarom dit paar gekozen is; hij
 * staat niet in de zin die de lezer leest.
 *
 * Dit is de hele lijst: welke paren bestaan en in welke volgorde. De zin per paar staat
 * in het woordenbestand van de taal, op precies deze sleutels.
 */
const NEIGHBOURS = {
  'leaving-home': [
    'household-size', // r = 0,77 over 29 landen
    'working-life', // r = −0,73 over 30 landen
  ],
  'household-size': [
    'dwelling-size', // De eigen berekening op /dwelling-size/ gaat precies over dit paar.
    'leaving-home', // r = 0,77 over 29 landen
  ],
  'dwelling-size': [
    'household-size',
    'wealth', // r = 0,70 over 20 landen
    /**
     * r = 0,51 over 32 landen. Deze staat hier omdat first-child anders de enige
     * metriek is waar geen enkele andere pagina naar verwijst.
     */
    'first-child',
  ],
  'working-life': [
    'working-hours', // r = −0,69 over 32 landen
    'pension-age', // r = 0,74 over 29 landen
  ],
  'working-hours': [
    'working-life', // r = −0,69 over 32 landen
    'leaving-home', // r = 0,64 over 31 landen
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
  unemployment: ['leaving-home', 'working-life'],
  'pension-age': ['healthy-years', 'working-life'],
  'healthy-years': ['pension-age', 'working-life'],
  'first-child': ['leaving-home', 'dwelling-size'],
  wealth: ['dwelling-size', 'household-size'],
};

/**
 * Alles wat van de taal afhangt, één keer per taal.
 *
 * Dit was moduleniveau, en dat is precies waarom de Nederlandse pagina's Engelse namen
 * toonden: een `const` buiten een functie wordt één keer bij import berekend en is
 * tussen alle pagina's van één build gedeeld. Dezelfde fout als CATALOGUE en
 * METHODOLOGY hadden.
 */
const perLang = new Map();

function contextFor(lang) {
  let found = perLang.get(lang);
  if (found) return found;

  const metrics = {};
  for (const [key, { metric, index }] of Object.entries(RAW)) {
    metrics[key] = { metric: localiseMetric(metric, lang), index: localise(index, lang) };
  }

  /** Vermogen heeft een andere vorm; zie wealthEntry() in catalogue.js. */
  const named = localise(wealthData, lang);
  const WEALTH = {
    key: 'wealth',
    label: ui(lang).metricLabels.wealth,
    path: '/wealth/',
    values: new Map(
      named.countries
        .filter((country) => typeof country.median === 'number')
        // Eurostat schrijft EL waar de ECB GR schrijft.
        .map((country) => [
          country.area === 'GR' ? 'EL' : country.area,
          { value: country.median, name: country.name },
        ]),
    ),
    show: (value) => euro(value, { compact: true, locale: lang }),
  };

  const valuesOf = (key) =>
    key === 'wealth'
      ? WEALTH.values
      : new Map(
          currentCountries(metrics[key].index).map((country) => [
            country.code,
            { value: country.total, name: country.name },
          ]),
        );

  const show = (key, value) =>
    key === 'wealth' ? WEALTH.show(value) : formatValue(value, { ...metrics[key].metric, locale: lang });
  const label = (key) => (key === 'wealth' ? WEALTH.label : metrics[key].metric.label);
  const path = (key) => (key === 'wealth' ? WEALTH.path : metrics[key].metric.path);

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

  found = {
    metrics,
    show,
    label,
    path,
    ends,
    crossings,
    g: grammarOf(lang),
    copy: COPY[lang] ?? COPY[DEFAULT_LOCALE],
  };
  perLang.set(lang, found);
  return found;
}

/**
 * De buren van één metriek, met hun zin, in de taal van de pagina.
 *
 * Een paar waarvan één kant in minder dan acht gedeelde landen zit valt stil weg; liever
 * een buur minder dan een zin over acht landen.
 */
export function related(key, lang = DEFAULT_LOCALE) {
  const ctx = contextFor(lang);

  return (NEIGHBOURS[key] ?? [])
    .map((to) => {
      const e = ctx.ends(key, to);
      if (!e) return null;

      const write = ctx.copy[key]?.[to];
      if (!write) return null;

      const cross = ctx.crossings(key, to);
      const line = write({ e, cross, show: ctx.show, g: ctx.g, crossings: ctx.crossings });

      return { key: to, label: ctx.label(to), path: ctx.path(to), line, of: e.of };
    })
    .filter(Boolean);
}

/**
 * Het artikel over de reeksbreuk, maar alleen op pagina's waar daadwerkelijk een breuk
 * ligt. Op /working-life/ of een dataset van één jaar zou het een voetnoot zijn bij een
 * probleem dat die pagina niet heeft.
 */
export function breakNote(key, lang = DEFAULT_LOCALE) {
  const index = contextFor(lang).metrics[key]?.index;
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
