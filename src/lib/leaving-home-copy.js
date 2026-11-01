/**
 * De zinnen die de pagina "leaving home" na een keuze van de bezoeker toont, en de
 * gegevens die de browser daarvoor nodig heeft.
 *
 * Dit is een tweede bestand naast src/lib/leaving-home.js, met opzet: dat bestand is
 * de bron van alle rekenwerk en alle formattering, dit bestand zet daar alleen zinnen
 * van in elkaar. Dezelfde functies draaien op de server (de HTML die er al staat) en
 * in de browser (wat er na een keuze verschijnt), zodat er één definitie van een zin
 * bestaat en geen twee die uiteen kunnen lopen. Er staat geen getal met de hand in.
 *
 * Zinnen zijn rijen van stukken: een gewone tekst, of een object met `strong` of `em`
 * voor nadruk. De browser maakt er elementen van met textContent, nooit met innerHTML.
 */
import { age, years, withArticle, currentCountries, euAggregate, comparison } from './leaving-home.js';
import { decimal } from './format.js';

/** Grenzen van het invoerveld, gelijk aan wat de pagina nu al controleert. */
export const AGE_MIN = 10;
export const AGE_MAX = 60;

export const validAge = (value) => Number.isFinite(value) && value >= AGE_MIN && value <= AGE_MAX;

/** Wat de browser nodig heeft: alleen de landen op het laatste jaar, en het Europese cijfer. */
export function clientData(index) {
  const eu = euAggregate(index);
  return {
    latestYear: index.latestYear,
    eu: eu ? eu.total : null,
    countries: currentCountries(index).map(({ code, name, year, total }) => ({ code, name, year, total })),
  };
}

/**
 * De verandering van het Europese cijfer ten opzichte van het jaar ervoor, maar alleen
 * als die twee jaren vergelijkbaar zijn. Staat er een reeksbreuk op het laatste jaar,
 * dan is er geen verschil om te tonen en geeft deze functie null.
 */
export function euChange(index) {
  const eu = euAggregate(index);
  if (!eu) return null;
  const previous = String(Number(index.latestYear) - 1);
  if (eu.breaks.includes(index.latestYear) || eu.series[previous] === undefined) return null;
  return { delta: eu.total - eu.series[previous], previousYear: previous };
}

const strong = (text) => ({ strong: text });
const em = (text) => ({ em: text });

/**
 * Eigen leeftijd zoals ingevoerd: hele jaren zonder decimaal, halve jaren met één.
 *
 * Via de grens, want dit getal staat in een zin: `21,5` in het Nederlands en `21.5`
 * in het Engels. Een niet-getal werd hier `"NaN"` en wordt nu een streepje.
 */
export const ownAge = (value, { locale } = {}) =>
  decimal(value, Number.isInteger(value) ? 0 : 1, { locale }) ?? '—';

/**
 * De zin onder de landkiezer in de kop: waar het gekozen land staat ten opzichte van
 * het Europese cijfer. Null als het land niet in de gegevens zit.
 */
export function youLine(data, code) {
  const home = data.countries.find((country) => country.code === code);
  if (!home) return null;

  const lead = [`In ${withArticle(home.name)} half had left by `, strong(age(home.total))];
  if (data.eu === null) return [...lead, '.'];

  const difference = home.total - data.eu;
  if (Math.abs(difference) < 0.05) return [...lead, ', right on the EU figure.'];
  return [
    ...lead,
    ': ',
    strong(`${years(Math.abs(difference))} ${difference > 0 ? 'later' : 'earlier'}`),
    ' than the EU figure.',
  ];
}

/**
 * De uitkomst van "waar pas jij". Geen percentiel: de gegevens kennen alleen het
 * middelpunt van elk land, dus het eerlijke antwoord is of je er vóór of erna zat.
 * Geeft null als de invoer niet geldig is of het land ontbreekt.
 */
export function resultCopy(data, { code, age: own }) {
  if (!validAge(own)) return null;
  const outcome = comparison(data, { code, age: own });
  const { home, difference, beforeMidpoint, of, closest } = outcome;
  const mine = ownAge(own);

  const verdict =
    beforeMidpoint === of
      ? [`That is before the midpoint of every one of the ${of} countries in the dataset.`]
      : beforeMidpoint === 0
        ? [`That is after the midpoint of all ${of} countries in the dataset.`]
        : ['That is before the midpoint in ', em(`${beforeMidpoint} of ${of}`), ` countries, and after it in ${of - beforeMidpoint}.`];

  let sub = [];
  if (home) {
    const year = home.year !== data.latestYear ? ` (${home.year})` : '';
    sub =
      Math.abs(difference) < 0.05
        ? [`That is exactly the point where half of ${withArticle(home.name)} had left: `, strong(age(home.total)), '.']
        : [
            `In ${withArticle(home.name)}, half had left by `,
            strong(age(home.total)),
            `${year}: you were `,
            strong(years(Math.abs(difference))),
            ` ${difference < 0 ? 'before' : 'after'} that point.`,
          ];
  }

  return {
    head: [`You left home at ${mine}. `, ...verdict],
    sub,
    closest: [`The country closest to your age is ${withArticle(closest.name)}, at ${age(closest.total)}.`],
    chips: [
      ['Your age', mine],
      ...(data.eu === null ? [] : [['EU', age(data.eu)]]),
      ...(home ? [[home.name, age(home.total)]] : []),
    ],
    home,
    own,
  };
}
