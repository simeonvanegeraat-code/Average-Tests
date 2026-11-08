/**
 * Alles wat de pagina /working-life/ uitrekent, los van de taal waarin hij het
 * verwoordt.
 *
 * Zesde pagina in de vorm van 3 november 2026: één plek rekent, twee plekken
 * verwoorden. `src/lib/pages/leaving-home.js` legt uit waarom die scheiding er is.
 *
 * DRIE DODE VELDEN NIET MEEGENOMEN
 *
 * Het oude paginabestand stuurde `latestYear`, `eu` en een `year` per land mee in het
 * JSON-blok, en het script las geen van de drie. Ze staan hier niet.
 */
import { localise } from '../country-names.js';
import { localiseMetric } from '../metric-names.js';
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
import baseMetric from '../metrics/working-life.js';
import rawIndex from '../../../data/working-life/index.json';

export function workingLifePage(lang) {
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
    fmt,
    amt,
    euValue: h.eu ? fmt(h.eu.total) : fmt(order[Math.floor(order.length / 2)].total),
    /** De landen waar vrouwen juist lánger werken dan mannen. */
    exceptions: gender?.exceptions ?? [],
    clientJson,
  };
}
