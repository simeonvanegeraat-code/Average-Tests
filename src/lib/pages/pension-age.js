/**
 * Alles wat de pagina /pension-age/ uitrekent, los van de taal waarin hij het verwoordt.
 *
 * Achtste pagina in de vorm van 3 november 2026, en de enige met twee uitgevers:
 *
 *   boven   Eurostat `lfso_23pens03` — de leeftijd waarop mensen een ouderdomspensioen
 *           zijn gaan ontvangen
 *   onder   de OECD — de leeftijd waarop mensen de arbeidsmarkt verlaten
 *
 * Twee vragen, geen twee metingen van hetzelfde. De pagina zegt dat uitdrukkelijk en
 * trekt ze niet van elkaar af; zie `src/lib/exit-age.js`. Les 5 uit CLAUDE.md geldt hier
 * dubbel, want hier zijn het zelfs twee verschillende uitgevers.
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
} from '../metric.js';
import { citation, exitAge, exitAgeRows } from '../exit-age.js';
import baseMetric from '../metrics/pension-age.js';
import rawIndex from '../../../data/pension-age/index.json';
import rawExitIndex from '../../../data/exit-age/index.json';

/** De zes grote economieën die de alinea over rijkdom noemt. */
const BIG = ['DE', 'FR', 'IT', 'ES', 'PL', 'NL'];

export function pensionAgePage(lang) {
  const index = localise(rawIndex, lang);
  const exitIndex = localise(rawExitIndex, lang);
  const metric = { ...localiseMetric(baseMetric, lang), locale: lang };

  const h = headline(index);
  const gender = genderGap(index);
  const stale = staleCountries(index);
  const order = ranked(index);
  const current = currentCountries(index);
  const exit = exitAge(exitIndex);
  const exitRows = exitAgeRows(exitIndex);
  const cite = citation(exitIndex);

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
    exitIndex,
    metric,
    h,
    gender,
    stale,
    exit,
    exitRows,
    cite,
    fmt,
    amt,
    names,
    euValue: h.eu ? fmt(h.eu.total) : fmt(order[Math.floor(order.length / 2)].total),
    early5: names(order.slice(0, 5)),
    late5: names(order.slice(-5).reverse()),
    bigOnes: current
      .filter((country) => BIG.includes(country.code))
      .sort((a, b) => a.total - b.total)
      .map((country) => `${country.name} ${fmt(country.total)}`)
      .join(', '),
    /**
     * De landen waar vrouwen juist láter begonnen dan mannen: de helft van het verhaal
     * die niemand verwacht.
     */
    womenLater: gender ? [...gender.exceptions].sort((a, b) => a.men - a.women - (b.men - b.women)) : [],
    clientJson,
  };
}
