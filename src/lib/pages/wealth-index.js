/**
 * Alles wat de pagina /wealth/ uitrekent, los van de taal waarin hij het verwoordt.
 *
 * Dertiende en laatste metriekpagina in de vorm van 3 november 2026.
 *
 * TWEE BRONNEN, EN DE PAGINA LEGT ZELF UIT WAAROM
 *
 * Boven staat de kwartaalrekening (DWA) mét pensioenaanspraken; de leeftijdslaag komt uit
 * de enquête (HFCS) zónder publieke en bedrijfspensioenen. `sourceGap` rekent uit hoe ver
 * de twee uiteenlopen, zodat de waarschuwing in het formulier echte cijfers draagt en
 * niet een vage "ze verschillen". Les 5 uit CLAUDE.md.
 *
 * De spreiding tussen landen wordt in de leeftijdssectie opnieuw uit `ageIndex` gerekend
 * in plaats van de `spread` hierboven te lenen: dat cijfer komt uit de kwartaalrekeningen
 * en zou de twee bronnen in één vergelijking zetten.
 */
import { localise } from '../country-names.js';
import { localiseWealthAge, localiseWealthIndex } from '../wealth-names.js';
import { euro, formatPeriod, multiple } from '../wealth.js';
import { bySteepness, curveOf, peaksByBand } from '../wealth-age.js';
import rawIndex from '../../../data/wealth/index.json';
import rawAgeIndex from '../../../data/wealth-age/index.json';
import validation from '../../../data/wealth-validation.json';

export function wealthIndexPage(lang) {
  const index = localiseWealthIndex(localise(rawIndex, lang), lang);
  const ageIndex = localiseWealthAge(localise(rawAgeIndex, lang), lang);

  /** Opmaak in de taal van deze pagina. Stond hier zonder locale, dus altijd Engels. */
  const money = (value, options = {}) => euro(value, { ...options, locale: lang });
  const times = (value) => multiple(value, { locale: lang });

  const countries = index.countries;
  const richest = countries[0];
  const poorest = countries[countries.length - 1];

  // De grootste kloof tussen eigenaren en huurders, uit de data gehaald in plaats van met
  // de hand gekozen.
  const gaps = countries
    .filter((c) => c.homeowners && c.renters)
    .map((c) => ({ ...c, gap: c.homeowners / c.renters }))
    .sort((a, b) => b.gap - a.gap);

  /** Hoe ver de twee bronnen per land uiteenlopen, voor de waarschuwing in het formulier. */
  const sourceGap = (() => {
    const pairs = index.countries
      .map((c) => {
        const survey = ageIndex.countries.find((a) => a.area === c.area);
        return survey?.total.median ? { name: c.name, ratio: c.median / survey.total.median } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.ratio - b.ratio);
    return {
      of: pairs.length,
      lowest: pairs[0],
      highest: pairs[pairs.length - 1],
      middle: pairs[Math.floor(pairs.length / 2)],
    };
  })();

  const steep = bySteepness(ageIndex.countries);
  const steepest = steep[0];
  const flattest = steep[steep.length - 1];

  const surveyMedians = [...ageIndex.countries].sort((a, b) => a.total.median - b.total.median);
  const surveySpread =
    surveyMedians[surveyMedians.length - 1].total.median / surveyMedians[0].total.median;
  const climbs = ageIndex.countries
    .map((c) => c.climb)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  return {
    index,
    ageIndex,
    validation,
    countries,
    richest,
    poorest,
    euroArea: index.euroArea,
    spread: richest.median / poorest.median,
    widestGap: gaps[0],
    concentrated: countries.filter((c) => c.mean && c.mean > c.median * 2).length,
    sourceGap,
    steepest,
    flattest,
    steepestCurve: curveOf(steepest),
    flattestCurve: curveOf(flattest),
    surveySpread,
    middleClimb: climbs[Math.floor(climbs.length / 2)],
    /** Landen waar leeftijd het cijfer verder verschuift dan heel Europa doorkruisen. */
    steeperThanEurope: ageIndex.countries.filter((c) => c.climb > surveySpread),
    peaks: peaksByBand(ageIndex.countries, ageIndex.bands).sort(
      (a, b) => b.countries.length - a.countries.length,
    ),
    money,
    times,
    period: formatPeriod(index.latestPeriod),
    euroPeriod: formatPeriod(index.euroArea.period),
  };
}
