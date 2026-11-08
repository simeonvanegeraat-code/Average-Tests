/**
 * Alles wat de pagina /wealth/by-age/ uitrekent, los van de taal waarin hij het
 * verwoordt.
 *
 * Twaalfde pagina in de vorm van 3 november 2026.
 *
 * Deze pagina staat volledig op de ECB-enquête en raakt de kwartaalrekeningen van
 * /wealth/ nergens aan. Dat is geen voorzichtigheid maar noodzaak: de enquête telt
 * publieke en bedrijfspensioenen niet mee, dus haar cijfers liggen op een ander niveau.
 * Eén tabel met beide erin zou een vergelijking suggereren die niet bestaat. Les 5 uit
 * CLAUDE.md.
 *
 * Wat deze pagina beantwoordt en geen andere: hoe sterk leeftijd het vermogen van een
 * huishouden verschuift, en hoe verschillend dat per land is. Op /wealth/ staat de
 * vergelijking tussen landen op één moment; hier staat de vergelijking binnen een land
 * over een leven.
 */
import { localise } from '../country-names.js';
import { localiseWealthAge } from '../wealth-names.js';
import { euro, multiple } from '../wealth.js';
import { bySteepness, curveOf, fieldworkLabel, peaksByBand } from '../wealth-age.js';
import { periodLabel } from '../period.js';
import rawAgeIndex from '../../../data/wealth-age/index.json';
import validation from '../../../data/wealth-age-validation.json';

export function wealthByAgePage(lang) {
  const ageIndex = localiseWealthAge(localise(rawAgeIndex, lang), lang);

  const countries = [...ageIndex.countries].sort((a, b) => a.name.localeCompare(b.name));
  const bands = ageIndex.bands;
  const euroArea = ageIndex.euroArea;

  /** Opmaak in de taal van deze pagina. Stond hier zonder locale, dus altijd Engels. */
  const money = (value, options = {}) => euro(value, { ...options, locale: lang });
  const times = (value) => multiple(value, { locale: lang });

  const steep = bySteepness(ageIndex.countries);
  const steepest = steep[0];
  const flattest = steep[steep.length - 1];

  /** Wie al over de top heen is in de oudste groep, en wie daar nog altijd klimt. */
  const oldestBand = bands[bands.length - 1].code;
  const stillClimbing = ageIndex.countries.filter((c) => c.peak === oldestBand);

  /** De vroegste en laatste veldwerkmaand over alle landen: het venster van deze golf. */
  const months = countries.flatMap((c) => [c.fieldwork.from, c.fieldwork.to]).sort();

  /**
   * Alleen wat de browser nodig heeft om tussen middelpunt en gemiddelde te wisselen.
   * De eurozonerij hoort erbij: die staat als laatste rij in dezelfde tabel, en bleef
   * zonder deze regel op de medianen staan terwijl de rest omschakelde.
   */
  const clientJson = JSON.stringify({
    bands: bands.map((b) => b.code),
    rows: [...countries, euroArea].map((c) => ({
      area: c.area,
      median: c.bands.map((b) => b.median),
      mean: c.bands.map((b) => b.mean),
    })),
  }).replace(/</g, '\\u003c');

  return {
    ageIndex,
    validation,
    countries,
    bands,
    euroArea,
    euroCurve: curveOf(euroArea),
    steepest,
    flattest,
    steepestCurve: curveOf(steepest),
    flattestCurve: curveOf(flattest),
    peaks: peaksByBand(ageIndex.countries, bands).sort(
      (a, b) => b.countries.length - a.countries.length,
    ),
    stillClimbing,
    turnedDown: ageIndex.countries.length - stillClimbing.length,
    firstMonth: periodLabel(months[0], { locale: lang }),
    lastMonth: periodLabel(months[months.length - 1], { locale: lang }),
    fieldworkOf: (country) => fieldworkLabel(country.fieldwork, { locale: lang }),
    money,
    times,
    clientJson,
  };
}
