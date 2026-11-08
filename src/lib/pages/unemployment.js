/**
 * Alles wat de pagina /unemployment/ uitrekent, los van de taal waarin hij het verwoordt.
 *
 * Negende pagina in de vorm van 3 november 2026. Deze is de eerste op een bron die per
 * maand publiceert, en de eerste zonder invoerformulier.
 *
 * TWEE VENSTERS, STRENG APART
 *
 * `trend()` geeft het venster waarin alle dertig landen onderling vergelijkbaar zijn; dat
 * is maar achttien maanden breed, omdat Malta en Denemarken een reeksbreuk dragen.
 * `unbrokenRun()` geeft de volle vijf jaar, maar alleen per land en alleen voor de
 * achtentwintig landen die er ononderbroken door lopen. Welk venster een zin gebruikt
 * staat in die zin — op de pagina, want dat is een redactionele keuze.
 *
 * WAT HIER NIET STAAT
 *
 * De kop, de zin over de breuken en de opsommingen van landen die het meest verschoven
 * zijn: dat zijn zinnen en die staan in de twee paginabestanden. Deze lib levert de
 * getallen eronder, inclusief `euMove` en `outran`, zodat beide talen aan hetzelfde
 * cijfer hangen en de kop niet in één taal iets anders kan beweren dan in de andere.
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
  signed,
  staleCountries,
  trend,
  unbrokenRun,
} from '../metric.js';
import { aggregatePair, pairs, rankShift, widerThanSpread } from '../unemployment-age.js';
import { periodNumber } from '../period.js';
import baseMetric from '../metrics/unemployment.js';
import rawIndex from '../../../data/unemployment/index.json';
import rawYouthIndex from '../../../data/unemployment-under25/index.json';
import rawOlderIndex from '../../../data/unemployment-25to74/index.json';

export function unemploymentPage(lang) {
  const index = localise(rawIndex, lang);
  const youthIndex = localise(rawYouthIndex, lang);
  const olderIndex = localise(rawOlderIndex, lang);
  const metric = { ...localiseMetric(baseMetric, lang), locale: lang };

  const h = headline(index);
  const gender = genderGap(index);
  const movement = trend(index);
  const longer = unbrokenRun(index);
  const stale = staleCountries(index);
  const order = ranked(index);
  const current = currentCountries(index);

  /** Opmaak in de taal van deze pagina: `metric` draagt zijn locale. */
  const fmt = (value) => formatValue(value, metric);
  const amt = (value, options = {}) => formatAmount(value, metric, options);
  /** Met teken en zonder eenheid, voor een opsomming waar de eenheid in de zin staat. */
  const sign = (value) => signed(value, metric);

  /** De breedte van het vergelijkbare venster, in maanden, uit de perioden zelf. */
  const months = movement
    ? Math.round((periodNumber(movement.until) - periodNumber(movement.since)) * 12)
    : 0;

  /**
   * Wat het Europese cijfer in dat venster deed, en hoeveel landen méér verschoven dan
   * dat. Daar hangt de kop aan, en hij moet van het cijfer afhangen: staat het stil, dan
   * is het stilstaan het nieuws; beweegt het, dan die beweging. Zo kan de kop volgende
   * maand niet onwaar worden zonder dat er iets aan verandert.
   */
  const euMove = movement ? movement.euNow - movement.euThen : null;
  const outran =
    movement && euMove !== null
      ? movement.moved.filter((country) => Math.abs(country.change) > Math.abs(euMove)).length
      : 0;

  /** Landen zonder enkele vlag in hun reeks, en de landen die er wel een dragen. */
  const unbroken = current.filter((country) => country.breaks.length === 0);
  const flagged = current.filter((country) => country.breaks.length > 0);

  const agePair = aggregatePair(youthIndex, olderIndex);
  const agePairs = pairs(youthIndex, olderIndex).matched;

  /**
   * De nieuwste periode in het gedownloade venster is bijna leeg: Eurostat publiceert een
   * maand ongeveer 31 dagen na het einde, dus het laatste vakje vult zich nog. De bouwer
   * kiest daarom de nieuwste maand die genoeg landen heeft, en de methodesectie legt uit
   * welke maand daarmee buiten de pagina valt en met hoeveel landen.
   */
  const newestPeriod = index.years[index.years.length - 1];
  const newestCount = index.countries.filter(
    (country) => country.series[newestPeriod] !== undefined,
  ).length;

  return {
    index,
    youthIndex,
    olderIndex,
    metric,
    h,
    gender,
    movement,
    longer,
    stale,
    current,
    unbroken,
    flagged,
    agePair,
    agePairs,
    ageRank: rankShift(agePairs, index),
    ageWider: widerThanSpread(agePairs, index),
    /** Verhouding jong tegen oud, één decimaal, in de notatie van deze taal. */
    ageRatio: agePair ? decimal(agePair.ratio, 1, { locale: lang }) : null,
    fmt,
    amt,
    sign,
    months,
    euMove,
    outran,
    newestPeriod,
    newestCount,
    euValue: h.eu ? fmt(h.eu.total) : fmt(order[Math.floor(order.length / 2)].total),
  };
}
