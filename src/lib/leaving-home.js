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

export { count, currentCountries, euAggregate, genderGap, headline, ranked, staleCountries, trend, withArticle };

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
