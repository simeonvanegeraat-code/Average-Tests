/**
 * Alles wat de pagina /unemployment/by-age/ uitrekent, los van de taal waarin hij het
 * verwoordt.
 *
 * Tiende pagina in de vorm van 3 november 2026.
 *
 * Wat deze pagina beantwoordt en geen andere: de ranglijst van landen verandert van
 * volgorde zodra je alleen naar jongeren kijkt. Op /unemployment/ staat wie het slechtst
 * af is; hier staat dat dat antwoord van je leeftijd afhangt.
 *
 * Twee reeksen uit dezelfde dataset, en ze lopen niet gelijk: elk land draagt zijn eigen
 * laatste maand, en die hoeft tussen de twee leeftijdsklassen niet dezelfde te zijn.
 * `pairs()` in `src/lib/unemployment-age.js` eist daarom dezelfde maand en geeft de rest
 * apart terug; die landen worden op de pagina met naam genoemd in plaats van stil
 * weggelaten.
 */
import { localise } from '../country-names.js';
import { localiseMetric } from '../metric-names.js';
import { decimal } from '../format.js';
import { formatAmount, formatValue } from '../metric.js';
import {
  aggregatePair,
  gapRange,
  pairs,
  rankShift,
  sexGap,
  widerThanSpread,
} from '../unemployment-age.js';
import baseMetric from '../metrics/unemployment-under25.js';
import rawYouthIndex from '../../../data/unemployment-under25/index.json';
import rawOlderIndex from '../../../data/unemployment-25to74/index.json';
import rawTotalIndex from '../../../data/unemployment/index.json';

export function unemploymentByAgePage(lang) {
  const youthIndex = localise(rawYouthIndex, lang);
  const olderIndex = localise(rawOlderIndex, lang);
  const totalIndex = localise(rawTotalIndex, lang);
  const metric = { ...localiseMetric(baseMetric, lang), locale: lang };

  const { matched, skipped } = pairs(youthIndex, olderIndex);
  const eu = aggregatePair(youthIndex, olderIndex);
  const rank = rankShift(matched, totalIndex);
  const gaps = gapRange(matched);
  const sexes = sexGap(eu, totalIndex);

  /**
   * De verleiding is te schrijven dat leeftijd meer uitmaakt dan welk land dan ook. Dat
   * is onwaar — de landenspreiding is 3,9x en de leeftijdskloof in de EU 2,9x. Wat wél
   * waar is staat op de pagina, en het is te tellen.
   */
  const wider = widerThanSpread(matched, totalIndex);

  const anchor = youthIndex.latestYear;
  const behind = matched.filter((row) => row.period !== anchor);

  /** Opmaak in de taal van deze pagina: `metric` draagt zijn locale. */
  const fmt = (value) => formatValue(value, metric);
  const amt = (value, options = {}) => formatAmount(value, metric, options);
  /** "2,9×" — de verhouding tussen de twee leeftijdsklassen, in de notatie van deze taal. */
  const times = (value) => (value === null ? '—' : `${decimal(value, 1, { locale: lang })}×`);

  /** De grootste bewegers, beide kanten op, voor de bevindingen. */
  const worse = rank.movers.filter((row) => row.shift > 0).slice(0, 3);
  const better = rank.movers.filter((row) => row.shift < 0).slice(0, 3);
  /** Hoeveel landen vijf plaatsen of meer opschuiven — telbaar, in plaats van "veel". */
  const bigMovers = rank.movers.filter((row) => Math.abs(row.shift) >= 5).length;

  return {
    youthIndex,
    olderIndex,
    totalIndex,
    metric,
    matched,
    skipped,
    eu,
    rank,
    gaps,
    sexes,
    wider,
    anchor,
    behind,
    fmt,
    amt,
    times,
    worse,
    better,
    bigMovers,
  };
}
