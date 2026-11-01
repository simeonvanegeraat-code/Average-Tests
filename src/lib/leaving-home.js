/**
 * De metriek "leaving home": wat er specifiek is aan deze dataset.
 *
 * Het rekenwerk zelf staat in src/lib/metric.js en werkt op elke metriek in deze
 * repo. Wat hier overblijft is wat alléén voor deze dataset geldt: hoe je een
 * waarde schrijft, welke eenheid eraan hangt, en waar de zes klassegrenzen liggen.
 * De generieke functies worden hier doorgegeven zodat bestaande importeurs
 * ongewijzigd blijven werken.
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
import {
  bandOf,
  comparison as compare,
  count,
  currentCountries,
  euAggregate,
  genderGap,
  headline,
  ranked,
  staleCountries,
  trend,
  withArticle,
} from './metric.js';
import { decimal } from './format.js';

export { count, currentCountries, euAggregate, genderGap, headline, ranked, staleCountries, trend, withArticle };

/**
 * Eén decimaal, want zo publiceert Eurostat het ook.
 *
 * Dit zijn de twee formatteerfuncties van de eerste pagina, van vóór metric.js. Ze
 * staan er nog omdat veertien bestanden ze importeren, en ze gaan nu door dezelfde
 * grens als de rest — anders schrijft deze pagina straks `24.6` terwijl de pagina
 * ernaast `24,6` schrijft.
 */
export function age(value, { locale } = {}) {
  return decimal(value, 1, { locale }) ?? '—';
}

export function years(value, { sign = false, locale } = {}) {
  /**
   * Het woord komt uit het gétal, niet uit de opgemaakte tekst. Hier stond
   * `rounded === '1.0'`, een vergelijking met Engelse notatie: in het Nederlands is
   * dat `'1,0'` en zou er altijd een meervoud staan.
   */
  const magnitude = Math.abs(value);
  const unit = Number(magnitude.toFixed(1)) === 1 ? 'year' : 'years';
  const prefix = sign && value > 0 ? '+' : sign && value < 0 ? '−' : '';
  return `${prefix}${decimal(magnitude, 1, { locale })} ${unit}`;
}

/**
 * Zes vaste stappen. Dit is de enige plek waar deze grenzen staan;
 * src/lib/leaving-home-map.js importeert ze hiervandaan en StageMap leest ze daar
 * weer uit, zodat de kaart, de legenda en de tekst niet uit elkaar kunnen lopen.
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
  return bandOf(value, BANDS);
}

/** Neemt `age` waar de generieke versie `value` heet; verder identiek. */
export function comparison(index, { code, age: own }) {
  return compare(index, { code, value: own });
}
