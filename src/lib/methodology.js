/**
 * Per dataset: waar het vandaan komt, wat de uitgever er zelf over zegt, wat wij
 * ermee doen, hoe ver het reikt en wanneer het ververst is.
 *
 * Net als src/lib/catalogue.js rekent dit niets zelf uit. Elk veld komt uit het
 * `source`-blok dat de pipeline meeschrijft, uit de index zelf, of uit de
 * beschrijving in src/lib/metrics. De definitie is die van de uitgever, woordelijk
 * — niet onze samenvatting ervan. Dat is het hele punt van deze pagina: een lezer
 * moet kunnen nagaan of wij de bron goed gelezen hebben.
 *
 * Alleen op de server: dit importeert zeven JSON-bestanden.
 */
import { headline, staleCountries, currentCountries } from './metric.js';
import { periodLabel } from './period.js';
import { formatPeriod } from './wealth.js';
import { STAGES } from './hue.js';

import leavingHome from './metrics/leaving-home.js';
import workingLife from './metrics/working-life.js';
import workingHours from './metrics/working-hours.js';
import householdSize from './metrics/household-size.js';
import dwellingSize from './metrics/dwelling-size.js';
import healthyYears from './metrics/healthy-years.js';
import firstChild from './metrics/first-child.js';
import pensionAge from './metrics/pension-age.js';
import unemployment from './metrics/unemployment.js';

import leavingHomeData from '../../data/leaving-home/index.json';
import workingLifeData from '../../data/working-life/index.json';
import workingHoursData from '../../data/working-hours/index.json';
import householdSizeData from '../../data/household-size/index.json';
import dwellingSizeData from '../../data/dwelling-size/index.json';
import healthyYearsData from '../../data/healthy-years/index.json';
import firstChildData from '../../data/first-child/index.json';
import pensionAgeData from '../../data/pension-age/index.json';
import unemploymentData from '../../data/unemployment/index.json';
import exitAgeData from '../../data/exit-age/index.json';
import wealthData from '../../data/wealth/index.json';
import wealthCheck from '../../data/wealth-validation.json';
import wealthAgeData from '../../data/wealth-age/index.json';
import wealthAgeCheck from '../../data/wealth-age-validation.json';

/** Eurostat levert zijn definitie als HTML. Hier wordt het gewone tekst. */
function plain(html) {
  if (!html) return null;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "2026-04-16T23:00:00+0200" en "2026-10-24T16:49:53.624Z" worden allebei 2026-04-16. */
function day(stamp) {
  if (!stamp) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(stamp));
  return match ? match[1] : null;
}

function eurostat(metric, index) {
  const source = index.source ?? {};
  const { countries, year } = headline(index);
  const stale = staleCountries(index);

  /**
   * Tellen binnen dezelfde verzameling als `countries` hierboven, anders komt er
   * "32 of 31" te staan: landen die achterlopen dragen hun breukvlag nog wel.
   */
  const broken = currentCountries(index).filter((country) => country.breaks?.includes(index.lastBreak));

  /**
   * Landen met een breuk op een ánder moment dan de laatste. Bij de jaarreeksen is dat
   * er geen: Eurostat herzag in 2021 alles tegelijk. Werkloosheid breekt per land, en
   * zonder dit getal zou hier "1 van de 30 landen draagt een vlag" staan terwijl het er
   * twee zijn met twee verschillende data.
   */
  const alsoBroken = currentCountries(index).filter(
    (country) => (country.breaks?.length ?? 0) > 0 && !country.breaks.includes(index.lastBreak),
  );

  return {
    key: metric.key,
    label: metric.label,
    path: metric.path,
    hue: metric.hue,

    publisher: source.publisher ?? 'Eurostat',
    dataset: source.dataset ?? null,
    doi: source.doi ?? null,
    metadata: source.metadata ?? null,
    api: source.url ?? null,

    /** Hoe de uitgever het zelf noemt, en hoe hij het zelf definieert. */
    sourceLabel: source.label ?? null,
    definition: plain(source.definition),

    unit: metric.unit,
    decimals: metric.decimals,
    lenses: (metric.lenses ?? []).map((lens) => lens.label),

    countries,
    /**
     * Als leesbare naam en niet als code: werkloosheid staat op "2026-08", en dat hoort
     * "August 2026" te zijn zodra het in een zin belandt. Bij de jaarreeksen verandert
     * `periodLabel()` niets. Vermogen doet dit al met `formatPeriod()` hieronder.
     */
    year: periodLabel(year),
    firstYear: index.years?.length ? periodLabel(index.years[0]) : null,
    lastYear: index.years?.length ? periodLabel(index.years[index.years.length - 1]) : null,
    /**
     * Vier werkelijk verschillende gevallen, en ze vragen vier verschillende zinnen.
     * Eén sjabloon eroverheen leverde "0 of 32 countries carry a break flag in "
     * voor een reeks zonder breuk, en "no series break is published" voor een reeks
     * waar de breuk in het laatste jaar valt. Allebei onwaar.
     *
     * `single-year` is het vierde geval, en het moest apart: woninggrootte en
     * pensioenleeftijd hebben één jaargang. Die hebben geen breuk, maar "de hele
     * reeks vanaf 2023 is vergelijkbaar" zeggen over één jaar is een lege belofte.
     */
    comparability: index.years?.length === 1
      ? { kind: 'single-year', year: periodLabel(index.years[0]) }
      : !index.lastBreak
        ? { kind: 'unbroken', from: periodLabel(index.comparableSince ?? index.years?.[0] ?? null) }
        : index.comparableSince
          ? {
              kind: 'since',
              since: periodLabel(index.comparableSince),
              year: periodLabel(index.lastBreak),
              broken: broken.length,
              others: alsoBroken.length,
              otherYears: [...new Set(alsoBroken.flatMap((country) => country.breaks))]
                .map(periodLabel)
                .join(', '),
            }
          : { kind: 'break-at-end', year: periodLabel(index.lastBreak), broken: broken.length },

    stale: stale.map((country) => ({ name: country.name, year: periodLabel(country.year) })),

    published: day(source.eurostatUpdated),
    fetched: day(source.fetchedOn),
  };
}

/**
 * Vermogen heeft geen `source`-blok met velden: de ECB-pipeline schrijft er een
 * enkele regel. Wat hier staat komt uit de index en uit de poort; de vaste teksten
 * (uitgever, API) zijn namen, geen cijfers.
 */
function wealth() {
  return {
    key: 'wealth',
    label: 'Wealth',
    path: '/wealth/',
    hue: STAGES.money,

    publisher: 'European Central Bank',
    dataset: 'DWA (Distributional Wealth Accounts)',
    doi: null,
    metadata: 'https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.en.html',
    api: 'https://data-api.ecb.europa.eu/service/data/DWA',

    sourceLabel: String(wealthData.source ?? 'Distributional Wealth Accounts'),
    /**
     * Geen definitie. De pipeline haalt er geen op bij de ECB, en de pagina belooft
     * dat wat er staat een citaat van de uitgever is. Een samenvatting van mijzelf
     * onder dat kopje zetten zou die belofte breken.
     */
    definition: null,

    unit: 'euro',
    decimals: 0,
    lenses: ['Median', 'Mean', 'Homeowners', 'Renters'],

    countries: wealthCheck.countries,
    year: formatPeriod(wealthData.latestPeriod),
    firstYear: null,
    lastYear: null,
    /** De ECB publiceert geen reeksbreuken bij deze rekeningen. */
    comparability: { kind: 'none' },
    stale: [],

    quarters: wealthCheck.quarters,
    published: null,
    fetched: day(wealthData.generated),
    checked: wealthCheck.checkedOn,
  };
}

/**
 * De ECB-enquête onder /wealth/by-age/. Dezelfde uitgever als de rekeningen hierboven
 * en toch een eigen regel, want het is een andere meting: **publieke en
 * bedrijfspensioenen tellen er niet in mee**. Dat verschil is op de site de reden dat
 * de leeftijdscijfers in een eigen paneel staan, en het hoort dus ook hier te staan en
 * niet als voetnoot bij vermogen.
 */
function wealthAge() {
  const maanden = wealthAgeData.countries.flatMap((c) => [c.fieldwork.from, c.fieldwork.to]).sort();

  return {
    key: 'wealth-age',
    label: 'Wealth by age',
    path: '/wealth/by-age/',
    hue: STAGES.money,

    publisher: wealthAgeData.source.publisher,
    dataset: `${wealthAgeData.source.survey}, wave ${wealthAgeData.source.wave}`,
    doi: null,
    metadata: 'https://www.ecb.europa.eu/stats/ecb_surveys/hfcs/html/index.en.html',
    api: null,

    sourceLabel: wealthAgeData.source.tables,
    /** Woordelijk de definitie van de uitgever, want juist die wijkt af van de reeks erboven. */
    definition: wealthAgeData.source.definition,

    unit: 'euro',
    decimals: 0,
    lenses: ['Median', 'Average'],

    countries: wealthAgeData.countries.length,
    year: `wave ${wealthAgeData.source.wave}`,
    firstYear: null,
    lastYear: null,
    /**
     * Geen tijdreeks maar één golf, en het veldwerk loopt per land uiteen. Een eigen
     * geval, omdat "geen breuk" hier zou klinken als "de hele reeks is vergelijkbaar"
     * terwijl er geen reeks is.
     */
    comparability: {
      kind: 'survey-wave',
      wave: wealthAgeData.source.wave,
      from: maanden[0],
      to: maanden[maanden.length - 1],
      countries: wealthAgeData.countries.length,
    },
    stale: [],

    published: null,
    fetched: day(wealthAgeData.source.fetchedOn),
    checked: wealthAgeCheck.checkedOn,
    figuresChecked: wealthAgeCheck.figuresChecked,
  };
}

/**
 * De OECD-reeks onder /pension-age/. Geen eigen pagina, wel een eigen dataset: hij
 * heeft een eigen bron, een eigen poort en een eigen bronvermelding, dus hij hoort
 * hier te staan en niet verstopt onder de Eurostat-regel erboven.
 *
 * Deze bron heeft geen totaal, alleen mannen en vrouwen — dat staat bij "wat we per
 * land lezen", zodat het niet alleen op de pagina zelf te vinden is.
 */
function oecd() {
  const source = exitAgeData.source ?? {};
  const years = exitAgeData.years ?? [];

  return {
    key: 'exit-age',
    label: 'Exit age',
    path: '/pension-age/#exit-age',
    hue: pensionAge.hue,

    publisher: source.publisher ?? 'OECD',
    dataset: source.dataset ?? null,
    doi: null,
    metadata: source.terms ?? null,
    api: source.url ?? null,

    sourceLabel: source.name ?? null,
    definition: plain(source.description),

    unit: 'years',
    decimals: 1,
    /** Geen "Everyone": de OECD publiceert geen totaal. */
    lenses: ['Men', 'Women'],

    countries: exitAgeData.countriesAtLatestYear,
    year: exitAgeData.latestYear,
    firstYear: years[0] ?? null,
    lastYear: years[years.length - 1] ?? null,
    /** Geen enkele waarneming is gevlagd; validate-oecd.mjs valt om zodra dat verandert. */
    comparability: { kind: 'unbroken', from: years[0] ?? null },

    stale: (exitAgeData.countries ?? [])
      .filter((country) => country.year !== exitAgeData.latestYear)
      .map((country) => ({ name: country.name, year: country.year })),

    published: null,
    fetched: day(source.fetchedOn),
  };
}

/** Dezelfde volgorde als het paneel in de header. */
export const METHODOLOGY = [
  eurostat(leavingHome, leavingHomeData),
  eurostat(householdSize, householdSizeData),
  eurostat(dwellingSize, dwellingSizeData),
  eurostat(workingLife, workingLifeData),
  eurostat(workingHours, workingHoursData),
  eurostat(unemployment, unemploymentData),
  eurostat(pensionAge, pensionAgeData),
  oecd(),
  eurostat(healthyYears, healthyYearsData),
  eurostat(firstChild, firstChildData),
  wealth(),
  wealthAge(),
];
