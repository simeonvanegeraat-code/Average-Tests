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

/** Eén kaart uit een Eurostat-metriek, via de motor in metric.js. */
function entry(metric, index) {
  const { eu, countries, year } = headline(index);
  const range = spread(index);

  return {
    key: metric.key,
    path: metric.path,
    label: metric.label,
    hue: metric.hue,
    value: eu ? formatValue(eu.total, metric) : null,
    unit: metric.unit,
    low: range ? `${range.low.name} ${formatValue(range.low.total, metric)}` : null,
    high: range ? `${range.high.name} ${formatValue(range.high.total, metric)}` : null,
    at: range ? range.at : null,
    countries,
    year,
  };
}

/**
 * Vermogen komt van de ECB en heeft geen beschrijving in src/lib/metrics: de
 * landenrijen hebben `median` in plaats van `total`. De vorm van de kaart is verder
 * gelijk, dus dezelfde rekensom staat hier één keer uitgeschreven.
 *
 * Geen tint. Deze pagina staat als enige nog op de oude vormgeving, en een kleur
 * verzinnen zou betekenis suggereren die de vormtaal er niet aan geeft.
 */
function wealthEntry() {
  const withMedian = wealthData.countries.filter((country) => typeof country.median === 'number');
  const sorted = [...withMedian].sort((a, b) => a.median - b.median);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  const middle = wealthData.euroArea.median;
  const distance = high && low ? high.median - low.median : 0;

  return {
    key: 'wealth',
    path: '/wealth/',
    label: 'Wealth',
    hue: null,
    value: euro(middle, { compact: true }),
    unit: 'median',
    low: low ? `${low.name} ${euro(low.median, { compact: true })}` : null,
    high: high ? `${high.name} ${euro(high.median, { compact: true })}` : null,
    at: distance > 0 ? ((middle - low.median) / distance) * 100 : null,
    countries: withMedian.length,
    year: formatPeriod(wealthData.euroArea.period),
  };
}

/** De volgorde van de levenslijn: thuis, werk, gezondheid, gezin, geld. */
export const CATALOGUE = [
  entry(leavingHome, leavingHomeData),
  entry(householdSize, householdSizeData),
  entry(workingLife, workingLifeData),
  entry(workingHours, workingHoursData),
  entry(healthyYears, healthyYearsData),
  entry(firstChild, firstChildData),
  wealthEntry(),
];
