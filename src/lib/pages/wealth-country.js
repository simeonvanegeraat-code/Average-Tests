/**
 * Alles wat een landpagina onder /wealth/ uitrekent, los van de taal waarin hij het
 * verwoordt.
 *
 * Elfde pagina in de vorm van 3 november 2026, en de enige die 21 pagina's oplevert.
 *
 * Deze pagina's zijn geen varianten van hetzelfde sjabloon met een ander cijfer: landen
 * verschillen werkelijk. Duitsland heeft een lagere mediaan dan Italië ondanks een hoger
 * inkomen, in Zuid-Europa zit het vermogen in stenen en in Nederland in pensioen. Deze
 * lib leest die verschillen uit de data; de twee paginabestanden benoemen ze.
 *
 * TWEE BRONNEN OP ÉÉN PAGINA, EN DAT VRAAGT OM STRENGHEID
 *
 * Boven staat de kwartaalrekening (DWA) mét pensioenaanspraken; de leeftijdssectie komt
 * uit de enquête (HFCS) zónder publieke en bedrijfspensioenen. Les 5 uit CLAUDE.md: geen
 * enkele zin zet die twee naast elkaar, en de sectie zegt zelf waar ze vandaan komt.
 */
import { countryNames, localise } from '../country-names.js';
import { localiseWealthCountry, localiseWealthAge } from '../wealth-names.js';
import { decimal } from '../format.js';
import { euro, formatPeriod, multiple, percentChange } from '../wealth.js';
import { curveOf, fieldworkLabel } from '../wealth-age.js';
import rawIndex from '../../../data/wealth/index.json';
import rawAgeIndex from '../../../data/wealth-age/index.json';

export function wealthCountryPage(rawCountry, lang) {
  const index = localise(rawIndex, lang);
  const ageIndex = localiseWealthAge(localise(rawAgeIndex, lang), lang);
  /**
   * De eigen naam van het land erbij.
   *
   * `localise()` hernoemt rijen in `countries` en `aggregates`, en een landbestand heeft
   * geen van beide: zijn naam staat als losse sleutel naast `area`. Daardoor stond er op
   * /nl/wealth/at/ "Het middelste huishouden in Austria is …" — Nederlandse getallen met
   * een Engelse landnaam, in dezelfde zin.
   */
  const names = countryNames(lang);
  const named = { ...rawCountry, name: names[rawCountry.area] ?? rawCountry.name };
  const c = localiseWealthCountry(localise(named, lang), lang);

  /** Opmaak in de taal van deze pagina. Stond hier zonder locale, dus altijd Engels. */
  const money = (value, options = {}) => euro(value, { ...options, locale: lang });
  const times = (value) => multiple(value, { locale: lang });
  const pct = (value) => decimal(value, 1, { locale: lang });

  const byCode = Object.fromEntries(c.groups.map((g) => [g.code, g]));
  const status = Object.fromEntries(c.status.map((s) => [s.code, s]));
  const owners = status.HSO;
  const renters = status.HST;

  // Rangorde binnen Europa, uit de index in plaats van met de hand.
  const ranked = [...index.countries].sort((a, b) => b.median - a.median);
  const position = ranked.findIndex((x) => x.area === c.area) + 1;

  // Waar zit het vermogen van de middenmoot in? Dit verschilt sterk per land en is het
  // punt waarop deze pagina's echt uiteenlopen.
  const middle = c.composition?.Q3 ?? [];
  const assets = middle.filter((p) => p.side === 'asset').sort((a, b) => b.value - a.value);
  const debts = middle.filter((p) => p.side === 'liability');

  const bottomQuintile = byCode.Q1;

  /**
   * De leeftijdscurve van dit land, uit de ECB-enquête. Dit is ook wat deze landpagina's
   * van elkaar onderscheidt: de piek ligt niet overal bij dezelfde groep en de klim
   * ernaartoe verschilt van 1,6x tot 31,6x.
   */
  const survey = ageIndex.countries.find((a) => a.area === c.area) ?? null;

  return {
    index,
    ageIndex,
    c,
    byCode,
    owners,
    renters,
    housingGap: owners && renters ? owners.netWealth / renters.netWealth : null,
    yearChange: c.medianYearAgo ? percentChange(c.medianYearAgo.value, c.median) : null,
    meanToMedian: c.mean ? c.mean / c.median : null,
    ranked,
    position,
    euroArea: index.euroArea,
    middle,
    biggest: assets[0],
    secondBiggest: assets[1],
    totalDebt: debts.reduce((sum, d) => sum + Math.abs(d.value), 0),
    bottomQuintile,
    negativeBottom: bottomQuintile && bottomQuintile.netWealth < 0,
    survey,
    curve: survey ? curveOf(survey) : null,
    /** Hoeveel andere landen hun hoogtepunt bij dezelfde groep hebben. */
    sharePeak: survey ? ageIndex.countries.filter((a) => a.peak === survey.peak).length : 0,
    steeperThan: survey
      ? ageIndex.countries.filter((a) => Number.isFinite(a.climb) && a.climb < survey.climb).length
      : 0,
    money,
    times,
    pct,
    period: formatPeriod(c.period),
    fieldwork: survey ? fieldworkLabel(survey.fieldwork, { locale: lang }) : null,
  };
}
