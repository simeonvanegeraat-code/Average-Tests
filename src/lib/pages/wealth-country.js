/**
 * Alles wat een landpagina onder /wealth/ uitrekent, los van de taal waarin hij het
 * verwoordt.
 *
 * Elfde pagina in de vorm van 3 november 2026, en de enige die 21 pagina's oplevert.
 *
 * Deze lib leest per land uit de data wat de pagina benoemt. Let op wat de data níet
 * zegt: het grootste bezit van het middelste huishouden is in alle 21 landen woningbezit
 * en het tweede in alle 21 spaargeld. Een zin daarover onderscheidt geen enkel land. Het
 * plan om de pagina's werkelijk uit elkaar te laten lopen staat in
 * research/wealth-country-pages-plan.md.
 *
 * TWEE BRONNEN OP ÉÉN PAGINA, EN DAT VRAAGT OM STRENGHEID
 *
 * Boven staat de kwartaalrekening (DWA), de leeftijdssectie komt uit de enquête (HFCS).
 * Ze meten anders en op een ander moment, en verschillen in beide richtingen. Les 5 uit
 * CLAUDE.md: geen enkele zin zet die twee naast elkaar.
 *
 * Wat hier tot 17 november 2026 stond — "DWA mét pensioenaanspraken" — klopt niet. De
 * post F62 heet bij de ECB "Life insurance and annuity entitlements", een reeks voor
 * pensioenaanspraken (F63) zit niet in de download, en de ECB schrijft dat die nu niet
 * in de DWA zitten. Zie het plan, §2b.
 */
import { countryNames, localise } from '../country-names.js';
import { localiseWealthCountry, localiseWealthAge } from '../wealth-names.js';
import { decimal } from '../format.js';
import { euro, formatPeriod, multiple, percentChange } from '../wealth.js';
import { curveOf, fieldworkLabel } from '../wealth-age.js';
import { standsOut, medianNeighbours, commonWindow, MEASURES } from '../wealth-standout.js';
import rawIndex from '../../../data/wealth/index.json';
import rawAgeIndex from '../../../data/wealth-age/index.json';
import rawEuroArea from '../../../data/wealth/i9.json';

/**
 * Alle 21 landbestanden, want wat aan één land opvalt is een vergelijking met de andere
 * twintig. De index heeft geen samenstelling en geen tijdreeks, dus die volstaat niet.
 * I9 en I10 zijn eurozone-aggregaten en vallen af op hun code: twee letters is een land.
 */
const FILES = import.meta.glob('../../../data/wealth/*.json', { eager: true, import: 'default' });
const ALL = Object.entries(FILES)
  .filter(([path]) => /\/[a-z]{2}\.json$/.test(path))
  .map(([, country]) => country);

/** Eén keer per build, niet per pagina: dezelfde uitkomst voor alle 42. */
const STANDOUT = standsOut(ALL, rawEuroArea);
const MEASURE_COUNT = MEASURES.length;

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
   * In hoeveel landen het onderste vijfde negatief staat. Hier stond "This is not unusual
   * across Europe", met de hand getypt; nu zegt de zin hoeveel het er zijn.
   */
  const negativeBottomCount = index.countries.filter((x) =>
    (x.groups ?? []).some((g) => g.code === 'Q1' && g.netWealth < 0),
  ).length;

  /**
   * De leeftijdscurve van dit land, uit de ECB-enquête. Dit is ook wat deze landpagina's
   * van elkaar onderscheidt: de piek ligt niet overal bij dezelfde groep en de klim
   * ernaartoe verschilt van 1,6x tot 31,6x.
   */
  const survey = ageIndex.countries.find((a) => a.area === c.area) ?? null;

  /**
   * Wat aan dit land opvalt, met de namen van de landen die erbij genoemd worden al in de
   * taal van de pagina. De rekenkunde staat in src/lib/wealth-standout.js.
   */
  const pickNames = (list) =>
    list.map((v) => ({ ...v, name: names[v.area] ?? v.area, path: `/wealth/${v.area.toLowerCase()}/` }));
  const own = STANDOUT.byArea[c.area];
  const picks = own.picks.map((p) => ({ ...p, beyond: pickNames(p.beyond), next: pickNames(p.next) }));
  const gap = own.euroAreaGap;
  const euroAreaGap = gap
    ? { ...gap, label: c.composition?.Q3?.find((p) => p.code === gap.code)?.label ?? gap.code }
    : null;

  /** De buren op de mediaan, voor de kaartjes onderaan. */
  const near = medianNeighbours(c.area, index.countries);
  const neighbour = (x) =>
    x ? { area: x.area, name: names[x.area] ?? x.name, median: x.median, path: `/wealth/${x.area.toLowerCase()}/` } : null;

  /**
   * De lijn: de mediaan van dit land en die van de eurozone, allebei op 100 in het eerste
   * kwartaal, over het venster dat elk land heeft. Een index en geen bedrag, zodat de
   * twee lijnen in één vak passen zonder dat de eurozone als een land leest.
   *
   * De ECB-download kent een kolom PRE_BREAK_VALUE voor reeksbreuken. Op 17 november 2026
   * was die in alle 250.680 waarnemingen leeg; zou er ooit een breuk in komen, dan moet de
   * pijplijn hem doorgeven en deze lijn hem respecteren, zoals sparkline.js dat bij Eurostat
   * doet.
   */
  const window = commonWindow(ALL);
  const indexed = (history) => {
    const inWindow = (history ?? []).filter((h) => h.period >= window.from && h.period <= window.to);
    const base = inWindow[0]?.value;
    return base > 0 ? inWindow.map((h) => ({ period: h.period, value: (h.value / base) * 100 })) : [];
  };
  const line = {
    window,
    country: indexed(rawCountry.medianHistory),
    euroArea: indexed(rawEuroArea.medianHistory),
    growth: own.all.find((m) => m.key === 'growth')?.value ?? null,
    euroAreaGrowth: STANDOUT.euroAreaGrowth,
  };

  /**
   * Het aandeel van elke groep in al het vermogen: groepsgemiddelde maal de omvang van de
   * groep, gedeeld door het gemiddelde van iedereen. Zie MEASURES in wealth-standout.js.
   */
  const SIZE = { Q1: 0.2, Q2: 0.2, Q3: 0.2, Q4: 0.2, Q5: 0.2, D10: 0.1 };
  const shareOf = (g) => (SIZE[g.code] && c.mean > 0 ? (g.netWealth * SIZE[g.code]) / c.mean : null);

  return {
    picks,
    measures: own.all,
    measureCount: MEASURE_COUNT,
    shareOf,
    euroAreaGap,
    near: { above: neighbour(near.above), below: neighbour(near.below) },
    line,
    countryCount: ALL.length,
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
    negativeBottomCount,
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
