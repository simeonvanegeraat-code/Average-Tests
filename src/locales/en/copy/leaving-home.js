/**
 * De Engelse zinnen van /leaving-home/: de regel onder de landkiezer en het antwoord
 * na een eigen leeftijd.
 *
 * `src/lib/leaving-home-copy.js` rekent uit wát er waar is — in hoeveel landen je vóór
 * het middelpunt zit, welk land het dichtst bij je ligt, hoe ver je van dat middelpunt
 * af zit — en geeft die uitkomst hier naartoe. Dit bestand bepaalt alleen hoe dat
 * klinkt.
 *
 * **De nadrukpositie hoort hier en niet in de logica.** Een zin is een rij stukken, en
 * een object met `strong` of `em` is zo'n stuk. Waar de nadruk valt is een eigenschap
 * van de zin, dus van de taal: het Engels zegt "In the Netherlands half had left by
 * **21,2**", en een andere taal zet dat getal ergens anders. Zolang die rij in de logica
 * stond, was de Engelse woordorde onderdeel van het rekenwerk.
 *
 * De browser maakt van die stukken elementen met `textContent`, nooit met `innerHTML`.
 *
 * Dit bestand draait **alleen in de browser**: ResultPanel en StatHero importeren
 * `leaving-home-copy.js` in hun clientscript, de server rendert deze zinnen niet.
 */
import { grammarOf } from '../../../lib/grammar.js';

const g = grammarOf('en');

const strong = (text) => ({ strong: text });
const em = (text) => ({ em: text });

export default {
  units: { one: 'year', many: 'years' },

  /**
   * De regel onder de landkiezer in de kop.
   *
   * `eu` is null als er geen Europees cijfer is, `{ equal: true }` als het verschil in
   * de afronding verdwijnt, en anders `{ amount, later }`.
   */
  youLine: ({ name, value, eu }) => {
    const lead = [`In ${g.withArticle(name)} half had left by `, strong(value)];
    if (!eu) return [...lead, '.'];
    if (eu.equal) return [...lead, ', right on the EU figure.'];
    return [
      ...lead,
      ': ',
      strong(`${eu.amount} ${eu.later ? 'later' : 'earlier'}`),
      ' than the EU figure.',
    ];
  },

  /**
   * Waar je eigen leeftijd valt ten opzichte van de middelpunten.
   *
   * Geen percentiel, en dat is geen tekortkoming maar de data: we kennen alleen het
   * middelpunt van elk land. Vandaar dat deze zinnen tellen in hoeveel landen je vóór
   * dat punt zat, en niet hoeveel procent van de mensen.
   */
  verdict: ({ before, of }) => {
    if (before === of) return [`That is before the midpoint of every one of the ${of} countries in the dataset.`];
    if (before === 0) return [`That is after the midpoint of all ${of} countries in the dataset.`];
    return [
      'That is before the midpoint in ',
      em(`${before} of ${of}`),
      ` countries, and after it in ${of - before}.`,
    ];
  },

  head: ({ own, verdict }) => [`You left home at ${own}. `, ...verdict],

  /** Je zat precies op het middelpunt van je eigen land. */
  exactLine: ({ name, value }) => [
    `That is exactly the point where half of ${g.withArticle(name)} had left: `,
    strong(value),
    '.',
  ],

  /** Je zat ervoor of erna. `year` is leeg als het land op het laatste jaar staat. */
  homeLine: ({ name, value, year, distance, after }) => [
    `In ${g.withArticle(name)}, half had left by `,
    strong(value),
    `${year}: you were `,
    strong(distance),
    ` ${after ? 'after' : 'before'} that point.`,
  ],

  closest: ({ name, value }) => [`The country closest to your age is ${g.withArticle(name)}, at ${value}.`],

  /** De labels van de drie kerncijfers onder het antwoord. Het derde is een landnaam. */
  chips: { own: 'Your age', eu: 'EU' },

  facts: {
    genderValue: ({ womenEarlier, of }) => `${womenEarlier} of ${of}`,

    gender: ({ year, mean, exceptions }) =>
      `countries where women reach the midpoint before men in ${year}, by ${mean} on average.` +
      (exceptions.length === 0
        ? ''
        : ` The exception${exceptions.length === 1 ? ' is' : 's are'} ${exceptions.join(', ')}.`),

    spread: ({ since, until, countries }) =>
      `years between the earliest and the latest country, ${since} versus ${until}. ` +
      `Only the ${countries} countries with a value in both years.`,

    eu: ({ since, until, earlier, minimumMove, later }) =>
      `the European Union figure, ${since} to ${until}. ` +
      `${earlier} ${earlier === 1 ? 'country' : 'countries'} moved earlier by at least ${minimumMove}, ` +
      `${later} moved later.`,

    biggest: ({ since, name, from, to, g }) =>
      `years: the biggest move since ${since}, in ${g.withArticle(name)} (${from} to ${to}).`,

    widest: ({ year, name, men, women, g }) =>
      `years: the widest gap between men and women in ${year}, in ${g.withArticle(name)} ` +
      `(men ${men}, women ${women}).`,

    breakFoot: ({ since, lastBreak }) =>
      `Comparisons over time start in ${since}, the first year after Eurostat’s ${lastBreak} ` +
      `series break, so they cover a short window.`,
  },
};
