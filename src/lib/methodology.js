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
import { formatPeriod } from './wealth.js';
import { STAGES } from './hue.js';

import leavingHome from './metrics/leaving-home.js';
import workingLife from './metrics/working-life.js';
import workingHours from './metrics/working-hours.js';
import householdSize from './metrics/household-size.js';
import healthyYears from './metrics/healthy-years.js';
import firstChild from './metrics/first-child.js';

import leavingHomeData from '../../data/leaving-home/index.json';
import workingLifeData from '../../data/working-life/index.json';
import workingHoursData from '../../data/working-hours/index.json';
import householdSizeData from '../../data/household-size/index.json';
import healthyYearsData from '../../data/healthy-years/index.json';
import firstChildData from '../../data/first-child/index.json';
import wealthData from '../../data/wealth/index.json';
import wealthCheck from '../../data/wealth-validation.json';

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
    year,
    firstYear: index.years?.[0] ?? null,
    lastYear: index.years?.[index.years.length - 1] ?? null,
    /**
     * Drie werkelijk verschillende gevallen, en ze vragen drie verschillende zinnen.
     * Eén sjabloon eroverheen leverde "0 of 32 countries carry a break flag in "
     * voor een reeks zonder breuk, en "no series break is published" voor een reeks
     * waar de breuk in het laatste jaar valt. Allebei onwaar.
     */
    comparability: !index.lastBreak
      ? { kind: 'unbroken', from: index.comparableSince ?? index.years?.[0] ?? null }
      : index.comparableSince
        ? { kind: 'since', since: index.comparableSince, year: index.lastBreak, broken: broken.length }
        : { kind: 'break-at-end', year: index.lastBreak, broken: broken.length },

    stale: stale.map((country) => ({ name: country.name, year: country.year })),

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

/** Dezelfde volgorde als het paneel in de header. */
export const METHODOLOGY = [
  eurostat(leavingHome, leavingHomeData),
  eurostat(householdSize, householdSizeData),
  eurostat(workingLife, workingLifeData),
  eurostat(workingHours, workingHoursData),
  eurostat(healthyYears, healthyYearsData),
  eurostat(firstChild, firstChildData),
  wealth(),
];
