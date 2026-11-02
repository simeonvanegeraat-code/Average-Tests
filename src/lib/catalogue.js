/**
 * De catalogus: één regel per metriek, voor het paneel in de header.
 *
 * Dit bestand rekent niets zelf uit. Het roept dezelfde `headline()` en `spread()`
 * aan die de pagina's zelf gebruiken, zodat de kaart in het menu en de pagina
 * erachter niet uit elkaar kunnen lopen. Dat is de reden dat hier geen eigen
 * gegevensbestand en geen eigen poort bij hoort: er is geen tweede berekening om
 * tegen te controleren.
 *
 * Alleen op de server. Dit bestand importeert zeven JSON-bestanden; zodra het in een
 * clientscript belandt, staan die allemaal in de browser. De layout leest het in de
 * frontmatter en zet alleen het resultaat in de HTML.
 *
 * `value` mag null zijn. Publiceert een bron het Europese cijfer niet meer, dan toont
 * de kaart alleen de uitersten — liever een lege plek dan een plausibel getal.
 */
import { headline, spread, formatValue } from './metric.js';
import { euro, formatPeriod } from './wealth.js';
import { STAGES } from './hue.js';
import { DEFAULT_LOCALE } from './locales.js';
import { localise } from './country-names.js';

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
import wealthData from '../../data/wealth/index.json';

/** Eén kaart uit een Eurostat-metriek, via de motor in metric.js. */
function entry(metric, index, lang) {
  const cfg = { ...metric, locale: lang };
  const named = localise(index, lang);
  const { eu, countries, year } = headline(named);
  const range = spread(named);

  return {
    key: metric.key,
    /**
     * Zonder taalvoorvoegsel. De layout vergelijkt dit met een pad waar het
     * voorvoegsel al af is (zie `here` in BaseV2.astro) en zet het er bij een href
     * zelf weer voor. Eén van de twee moet het doen, en de layout weet de taal.
     */
    path: metric.path,
    label: metric.label,
    hue: metric.hue,
    value: eu ? formatValue(eu.total, cfg) : null,
    /**
     * De kaart toont een niveau ("6.1 %"), terwijl `metric.unit` de eenheid van een
     * vérschil is. Bij jaren en uren is dat hetzelfde woord, bij werkloosheid niet:
     * procent tegenover procentpunt. Vandaar `unitShort` waar die bestaat.
     */
    unit: metric.unitShort ?? metric.unit,
    low: range ? `${range.low.name} ${formatValue(range.low.total, cfg)}` : null,
    high: range ? `${range.high.name} ${formatValue(range.high.total, cfg)}` : null,
    at: range ? range.at : null,
    countries,
    year,
  };
}

/**
 * Vermogen komt van de ECB en heeft geen beschrijving in src/lib/metrics: de
 * landenrijen hebben `median` in plaats van `total`. De vorm van de kaart is verder
 * gelijk, dus dezelfde rekensom staat hier één keer uitgeschreven.
 */
function wealthEntry(lang) {
  const named = localise(wealthData, lang);
  const withMedian = named.countries.filter((country) => typeof country.median === 'number');
  const sorted = [...withMedian].sort((a, b) => a.median - b.median);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  const middle = named.euroArea.median;
  const distance = high && low ? high.median - low.median : 0;

  return {
    key: 'wealth',
    path: '/wealth/',
    label: 'Wealth',
    hue: STAGES.money,
    value: euro(middle, { compact: true, locale: lang }),
    unit: 'median',
    low: low ? `${low.name} ${euro(low.median, { compact: true, locale: lang })}` : null,
    high: high ? `${high.name} ${euro(high.median, { compact: true, locale: lang })}` : null,
    at: distance > 0 ? ((middle - low.median) / distance) * 100 : null,
    countries: withMedian.length,
    year: formatPeriod(named.euroArea.period),
  };
}

/**
 * De volgorde van de levenslijn: thuis, wonen, werk, pensioen, gezondheid, gezin, geld.
 *
 * Woninggrootte staat naast huishoudgrootte omdat ze samen één vraag beantwoorden
 * (hoeveel ruimte per persoon, zie src/lib/space-per-person.js), en pensioen staat
 * achter werk omdat het daar eindigt.
 */
/**
 * Dit was `export const CATALOGUE`, één keer berekend bij het importeren. Een
 * waarde die bij import ontstaat kan per definitie geen taal kennen: de module
 * wordt één keer geladen en daarna door elke pagina gedeeld, Engelse en Nederlandse
 * door elkaar. Het menu bleef daardoor Engels op een Nederlandse pagina, en dat is
 * precies het soort fout dat niemand ziet tot de tweede taal er staat.
 *
 * Dus een functie, met een cache per taal. De cache is geen snelheidstruc maar een
 * belofte: dezelfde taal geeft hetzelfde object, zodat twee aanroepen op één pagina
 * niet twee keer kunnen afwijken.
 */
const perLang = new Map();

export function catalogue(lang = DEFAULT_LOCALE) {
  let found = perLang.get(lang);
  if (!found) {
    found = [
      entry(leavingHome, leavingHomeData, lang),
      entry(householdSize, householdSizeData, lang),
      entry(dwellingSize, dwellingSizeData, lang),
      entry(workingLife, workingLifeData, lang),
      entry(workingHours, workingHoursData, lang),
      entry(unemployment, unemploymentData, lang),
      entry(pensionAge, pensionAgeData, lang),
      entry(healthyYears, healthyYearsData, lang),
      entry(firstChild, firstChildData, lang),
      wealthEntry(lang),
    ];
    perLang.set(lang, found);
  }
  return found;
}
