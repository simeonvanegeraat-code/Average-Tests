/**
 * Alles wat de pagina /working-hours/ uitrekent, los van de taal waarin hij het
 * verwoordt.
 *
 * Vijfde pagina in de vorm van 3 november 2026: één plek rekent, twee plekken
 * verwoorden. `src/lib/pages/leaving-home.js` legt uit waarom die scheiding er is.
 *
 * DRIE DODE BEREKENINGEN NIET MEEGENOMEN
 *
 * Het oude paginabestand rekende `ratio` (de langste week gedeeld door de kortste) en
 * `small5` / `large5` (de vijf uitersten aan elke kant) uit, en gebruikte geen van de
 * drie in de body. De import van `decimal` hing er alleen voor. Ze staan hier niet; wie
 * ze ooit nodig heeft rekent ze terug uit `order`.
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
import baseMetric from '../metrics/working-hours.js';
import rawIndex from '../../../data/working-hours/index.json';

/** De zes grote economieën die de alinea over rijkdom noemt. */
const BIG = ['DE', 'FR', 'IT', 'ES', 'PL', 'NL'];

export function workingHoursPage(lang) {
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
  }).replace(/</g, '\u003c');

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
    bigOnes: current
      .filter((country) => BIG.includes(country.code))
      .sort((a, b) => a.total - b.total)
      .map((country) => `${country.name} ${fmt(country.total)}`)
      .join(', '),
    clientJson,
  };
}
