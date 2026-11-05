/**
 * Alles wat de pagina /first-child/ uitrekent, los van de taal waarin hij het verwoordt.
 *
 * Derde pagina in de vorm van 3 november 2026: één plek rekent, twee plekken verwoorden.
 * `src/lib/pages/leaving-home.js` legt uit waarom die scheiding er is en wat hij kost.
 */
import { localise } from '../country-names.js';
import { localiseMetric } from '../metric-names.js';
import { currentCountries, formatAmount, formatValue, headline, ranked, staleCountries, trend } from '../metric.js';
import baseMetric from '../metrics/first-child.js';
import rawIndex from '../../../data/first-child/index.json';

/** De zes grote economieën die de alinea over het patroon noemt. */
const BIG = ['DE', 'FR', 'IT', 'ES', 'PL', 'NL'];

export function firstChildPage(lang) {
  const index = localise(rawIndex, lang);
  const metric = { ...localiseMetric(baseMetric, lang), locale: lang };

  const h = headline(index);
  const movement = trend(index);
  const stale = staleCountries(index);
  const order = ranked(index);
  const current = currentCountries(index);

  /** Opmaak in de taal van deze pagina: `metric` draagt zijn locale. */
  const fmt = (value) => formatValue(value, metric);
  const amt = (value, options = {}) => formatAmount(value, metric, options);

  const clientJson = JSON.stringify({
    decimals: metric.decimals,
    unit: metric.unit,
    unitOne: metric.unitOne,
    locale: lang,
    words: metric.words,
    countries: current.map(({ code, name, total }) => ({ code, name, total })),
  }).replace(/</g, '\\u003c');

  return {
    index,
    metric,
    h,
    movement,
    stale,
    fmt,
    amt,
    euValue: h.eu ? fmt(h.eu.total) : fmt(order[Math.floor(order.length / 2)].total),
    bigOnes: current
      .filter((country) => BIG.includes(country.code))
      .sort((a, b) => a.total - b.total)
      .map((country) => `${country.name} ${fmt(country.total)}`)
      .join(', '),
    clientJson,
  };
}
