/**
 * Alles wat de pagina /household-size/ uitrekent, los van de taal waarin hij het
 * verwoordt.
 *
 * Tweede pagina in de vorm van 3 november 2026: één plek rekent, twee plekken
 * verwoorden. `src/lib/pages/leaving-home.js` legt uit waarom die scheiding er is en wat
 * hij kost.
 *
 * Wat hier dus níét staat: een zin, een kop, een titel. Die horen in de paginabestanden,
 * want dat is precies wat per taal verschilt.
 */
import { localise } from '../country-names.js';
import { localiseMetric } from '../metric-names.js';
import { decimal } from '../format.js';
import {
  currentCountries,
  formatAmount,
  formatValue,
  genderGap,
  headline,
  ranked,
  staleCountries,
  trend,
} from '../metric.js';
import baseMetric from '../metrics/household-size.js';
import rawIndex from '../../../data/household-size/index.json';

/** De zes grote economieën die de alinea over het geografische patroon noemt. */
const BIG = ['DE', 'FR', 'IT', 'ES', 'PL', 'NL'];

export function householdSizePage(lang) {
  const index = localise(rawIndex, lang);
  const metric = { ...localiseMetric(baseMetric, lang), locale: lang };

  const h = headline(index);
  const gender = genderGap(index);
  const movement = trend(index);
  const stale = staleCountries(index);
  const order = ranked(index);
  const current = currentCountries(index);

  /** Opmaak in de taal van deze pagina: `metric` draagt zijn locale. */
  const fmt = (value) => formatValue(value, metric);
  const amt = (value, options = {}) => formatAmount(value, metric, options);

  const names = (list) => list.map((country) => country.name).join(', ');

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
    gender,
    movement,
    stale,
    order,
    current,
    fmt,
    amt,
    euValue: h.eu ? fmt(h.eu.total) : fmt(order[Math.floor(order.length / 2)].total),
    ratio: decimal(h.latest.total / h.earliest.total, 2, { locale: lang }),
    small5: names(order.slice(0, 5)),
    large5: names(order.slice(-5)),
    bigOnes: current
      .filter((country) => BIG.includes(country.code))
      .sort((a, b) => a.total - b.total)
      .map((country) => `${country.name} ${fmt(country.total)}`)
      .join(', '),
    clientJson,
  };
}
