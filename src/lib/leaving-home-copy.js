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
import { age, years, currentCountries, euAggregate, comparison } from './leaving-home.js';
import { decimal } from './format.js';
import { DEFAULT_LOCALE } from './locales.js';
import enCopy from '../locales/en/copy/leaving-home.js';
import nlCopy from '../locales/nl/copy/leaving-home.js';

/**
 * De zinnen per taal. Een taal erbij is de import hierboven en een sleutel hier;
 * validate-i18n.mjs vergelijkt deze sleutels met LOCALES.
 *
 * De taal reist mee in `clientData()`, en dus in het JSON-blok dat de browser leest.
 * Dat is dezelfde truc als `cfg.locale` bij de kaart: de taal gaat met de gegevens die
 * de client toch al krijgt, zodat er geen tweede weg is waarlangs hij kan afwijken.
 */
const COPY = { en: enCopy, nl: nlCopy };

const copyOf = (lang) => COPY[lang] ?? COPY[DEFAULT_LOCALE];

/** Welke talen hier zinnen hebben. Alleen voor de poort. */
export const COPY_LANGUAGES = Object.keys(COPY);

/** Grenzen van het invoerveld, gelijk aan wat de pagina nu al controleert. */
export const AGE_MIN = 10;
export const AGE_MAX = 60;

export const validAge = (value) => Number.isFinite(value) && value >= AGE_MIN && value <= AGE_MAX;

/**
 * Wat de browser nodig heeft: alleen de landen op het laatste jaar, het Europese cijfer,
 * en de taal waarin de zinnen moeten komen.
 */
export function clientData(index, lang = DEFAULT_LOCALE) {
  const eu = euAggregate(index);
  return {
    lang,
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

  const copy = copyOf(data.lang);
  const base = { name: home.name, value: age(home.total) };

  if (data.eu === null) return copy.youLine({ ...base, eu: null });

  const difference = home.total - data.eu;
  if (Math.abs(difference) < 0.05) return copy.youLine({ ...base, eu: { equal: true } });

  return copy.youLine({
    ...base,
    eu: { amount: years(Math.abs(difference)), later: difference > 0 },
  });
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
  const copy = copyOf(data.lang);
  const mine = ownAge(own, { locale: data.lang });

  const verdict = copy.verdict({ before: beforeMidpoint, of });

  let sub = [];
  if (home) {
    const year = home.year !== data.latestYear ? ` (${home.year})` : '';
    sub =
      Math.abs(difference) < 0.05
        ? copy.exactLine({ name: home.name, value: age(home.total) })
        : copy.homeLine({
            name: home.name,
            value: age(home.total),
            year,
            distance: years(Math.abs(difference)),
            after: difference >= 0,
          });
  }

  return {
    head: copy.head({ own: mine, verdict }),
    sub,
    closest: copy.closest({ name: closest.name, value: age(closest.total) }),
    chips: [
      [copy.chips.own, mine],
      ...(data.eu === null ? [] : [[copy.chips.eu, age(data.eu)]]),
      ...(home ? [[home.name, age(home.total)]] : []),
    ],
    home,
    own,
  };
}
