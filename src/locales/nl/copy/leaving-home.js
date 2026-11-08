/**
 * De Nederlandse zinnen van /nl/leaving-home/.
 *
 * Tegenhanger van `src/locales/en/copy/leaving-home.js`, met dezelfde functies en
 * dezelfde argumenten. `src/lib/leaving-home-copy.js` rekent uit in hoeveel landen je
 * vóór het middelpunt zit en welk land het dichtst bij je ligt; dit bestand zet daar
 * zinnen van.
 *
 * Twee dingen zijn hier anders dan in het Engels, en daar is dit bestand voor:
 *
 *  - **De nadruk valt op een andere plek.** Het Engels zegt "half had left by **23,4**",
 *    het Nederlands "was de helft het huis uit op **23,4**" — en in de verdict-zin staat
 *    de nadruk op "x van y" op een andere positie in de zin.
 *  - **"before/after" wordt "vóór/ná" met een accent.** Zonder dat accent leest "voor"
 *    als een voorzetsel van richting en niet van tijd, en dan betekent de zin iets anders.
 */
import { grammarOf } from '../../../lib/grammar.js';

const g = grammarOf('nl');

const strong = (text) => ({ strong: text });
const em = (text) => ({ em: text });

/** Een opsomming zoals het Nederlands die afsluit: "A, B en C", niet "A, B, C". */
const lijst = (namen) =>
  namen.length < 2 ? (namen[0] ?? '') : `${namen.slice(0, -1).join(', ')} en ${namen.at(-1)}`;
export default {
  units: { one: 'jaar', many: 'jaar' },

  youLine: ({ name, value, eu }) => {
    const lead = [`In ${g.withArticle(name)} was de helft het huis uit op `, strong(value)];
    if (!eu) return [...lead, '.'];
    if (eu.equal) return [...lead, ', precies op het EU-cijfer.'];
    return [
      ...lead,
      ': ',
      strong(`${eu.amount} ${eu.later ? 'later' : 'eerder'}`),
      ' dan het EU-cijfer.',
    ];
  },

  verdict: ({ before, of }) => {
    if (before === of) return [`Dat is vóór het middelpunt van elk van de ${of} landen in de dataset.`];
    if (before === 0) return [`Dat is ná het middelpunt van alle ${of} landen in de dataset.`];
    return [
      'Dat is vóór het middelpunt in ',
      em(`${before} van ${of}`),
      ` landen, en erna in ${of - before}.`,
    ];
  },

  head: ({ own, verdict }) => [`Je ging het huis uit op ${own}. `, ...verdict],

  exactLine: ({ name, value }) => [
    `Dat is precies het punt waarop de helft van ${g.withArticle(name)} vertrokken was: `,
    strong(value),
    '.',
  ],

  homeLine: ({ name, value, year, distance, after }) => [
    `In ${g.withArticle(name)} was de helft het huis uit op `,
    strong(value),
    `${year}: jij was `,
    strong(distance),
    ` ${after ? 'later' : 'eerder'} dan dat punt.`,
  ],

  closest: ({ name, value }) => [
    `Het land dat het dichtst bij jouw leeftijd ligt is ${g.withArticle(name)}, op ${value}.`,
  ],

  chips: { own: 'Jouw leeftijd', eu: 'EU' },

  facts: {
    genderValue: ({ womenEarlier, of }) => `${womenEarlier} van de ${of}`,

    /**
     * Het Engels zegt "by 2,0 years on average" en laat de richting aan het werkwoord
     * ervoor. Het Nederlands moet die richting hier herhalen, anders staat er een
     * verschil zonder kant: "gemiddeld 2,0 jaar" zegt niet eerder of later.
     */
    gender: ({ year, mean, exceptions }) =>
      `landen waar vrouwen het middelpunt eerder bereiken dan mannen in ${year}, ` +
      `gemiddeld ${mean} eerder.` +
      (exceptions.length === 0
        ? ''
        : ` De uitzondering${exceptions.length === 1 ? ' is' : 'en zijn'} ${lijst(exceptions)}.`),

    spread: ({ since, until, countries }) =>
      `jaar tussen het vroegste en het laatste land, ${since} tegenover ${until}. ` +
      `Alleen de ${countries} landen met een waarde in beide jaren.`,

    eu: ({ since, until, earlier, minimumMove, later }) =>
      `het cijfer voor de Europese Unie, ${since} tot ${until}. ` +
      `${earlier} ${earlier === 1 ? 'land ging' : 'landen gingen'} minstens ${minimumMove} eerder, ` +
      `${later} later.`,

    biggest: ({ since, name, from, to, g }) =>
      `jaar: de grootste verschuiving sinds ${since}, in ${g.withArticle(name)} (${from} naar ${to}).`,

    widest: ({ year, name, men, women, g }) =>
      `jaar: het grootste verschil tussen mannen en vrouwen in ${year}, in ${g.withArticle(name)} ` +
      `(mannen ${men}, vrouwen ${women}).`,

    breakFoot: ({ since, lastBreak }) =>
      `Vergelijkingen over tijd beginnen in ${since}, het eerste jaar na de reeksbreuk van ` +
      `${lastBreak} bij Eurostat, dus ze dekken een kort venster.`,
  },
};
