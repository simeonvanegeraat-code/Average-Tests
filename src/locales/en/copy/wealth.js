/**
 * De Engelse zinnen van het vergelijkingsformulier op /wealth/.
 *
 * Deze zinnen draaien **in de browser**: de bezoeker vult een bedrag in en de hele
 * vergelijking over 21 landen gebeurt daar, zonder server. Tot 9 november 2026 stonden ze
 * uitgeschreven in het paginabestand, en sinds elke pagina per taal bestaat zou dat twee
 * keer zijn — twee versies van 350 regels gedrag die uiteen kunnen lopen.
 *
 * `src/components/WealthCompare.astro` kiest de taal uit `<html lang>` en geeft elke
 * functie alleen opgemaakte tekst: bedragen zijn al door `euro()` gegaan, verhoudingen
 * door `multiple()`. Zo kan de notatie van een getal hier niet meer afwijken van de
 * notatie op de pagina eromheen.
 *
 * TWEE BRONNEN, TWEE GROEPEN ZINNEN
 *
 * `country` hangt aan de kwartaalrekeningen (met pensioenaanspraken), `age` aan de
 * enquête (zonder publieke en bedrijfspensioenen). Geen zin hier zet een cijfer uit de
 * ene groep in een zin van de andere. Les 5 uit CLAUDE.md, en op deze pagina staat het
 * verschil zelf ook uitgelegd.
 */
export default {
  errors: {
    amountMissing: 'Enter a figure for what your household is worth.',
    amountRange: 'Enter an amount between −€5 million and €100 million.',
    ageRange: 'Enter an age between 16 and 110, or leave that field empty.',
  },

  country: {
    /** Drie gevallen en niet twee: precies op de mediaan is niet "boven" met €0 verschil. */
    headline: ({ name, exact, above, g }) =>
      exact
        ? `Exactly the median household in ${g.withArticle(name)}`
        : above
          ? `Above the median household in ${g.withArticle(name)}`
          : `Below the median household in ${g.withArticle(name)}`,

    /**
     * De openingszin. Drie gevallen, want "het zou nog steeds boven de mediaan liggen in
     * 0 van de 21 landen" is onzin en dat is precies wat er uit één sjabloonzin rolt.
     */
    lead: ({ times, aboveIn, total, above }) => {
      if (aboveIn === 0) {
        return `That is ${times} the median household, and below the median in every one of the ${total} countries here.`;
      }
      if (aboveIn === total) {
        return `That is ${times} the median household — above the median in all ${total} countries here.`;
      }
      return above
        ? `That is ${times} the median household, and above the median in ${aboveIn} of the ${total} countries here.`
        : `That is ${times} the median household at home, but it would still sit above the median in ${aboveIn} of the other ${total} countries.`;
    },

    /** Alleen uitspraken die de data draagt: tussen welke twee groepsgemiddelden val je. */
    bracket: ({ beyond, belowLabel, belowValue, aboveLabel, aboveValue, name, g }) => {
      if (beyond) {
        return `Your amount is above the average of the top 20% of households in ${g.withArticle(name)} (${belowValue}). Beyond that point the published groups stop telling us anything useful — the top fifth stretches a very long way.`;
      }
      if (belowLabel && aboveLabel) {
        return `It sits between what the ${belowLabel} of households own on average (${belowValue}) and what the ${aboveLabel} own (${aboveValue}).`;
      }
      if (aboveLabel) {
        return `It sits below what the ${aboveLabel} of households own on average (${aboveValue}) — the bottom fifth of households in several countries owes more than it owns.`;
      }
      return '';
    },

    caption: ({ period }) =>
      `Median household net wealth per country, ${period}. Your amount is the marked line.`,
    chartTitle: 'Median household net wealth by country, with your amount marked',
  },

  age: {
    /** "75 and over" is in een paneelkop te lang; "75+" niet. */
    label: ({ band, name, g }) =>
      `Compared with ${band.replace(' and over', '+')} in ${g.withArticle(name)}`,
    headline: ({ above }) =>
      above ? 'Above the middle for your age group' : 'Below the middle for your age group',

    /** Wat de enquête over jouw groep zegt: het middelpunt, en het gemiddelde erboven. */
    lead: ({ name, band, median, times, aboveMean, mean, margin, g }) => {
      const half =
        `Half of households in ${g.withArticle(name)} whose reference person is ${band} ` +
        `are worth less than ${median}, half more.`;
      const where = times === null ? '' : ` Your amount is ${times} that middle.`;
      const average = aboveMean
        ? ` It is above the average for the group too (${mean}) — a higher bar, because a handful of large fortunes pull every average up.`
        : ` It is still below the average for that group (${mean}), which sits well above the middle because a handful of large fortunes pull it up.`;
      const give = margin ? ` The survey puts the middle at ${median} give or take ${margin}.` : '';
      return half + where + average + give;
    },

    /** De vorm van de curve in dit land, en of er wel een curve is om over te schrijven. */
    curve: ({ flat, name, peakLabel, peakValue, climb, youngestLabel, youngestValue, falls, oldestLabel, oldestValue, g }) => {
      if (flat) {
        return (
          `Age barely moves this figure in ${g.withArticle(name)}: the highest group ` +
          `(${peakLabel}) sits at ${peakValue}, only ${climb} the ` +
          `${youngestLabel} group. In most countries here that step is much larger.`
        );
      }
      const rise =
        `In ${g.withArticle(name)} the middle climbs from ${youngestValue} at ` +
        `${youngestLabel} to ${peakValue} at ${peakLabel} — ${climb} as much.`;
      const after = falls
        ? ` After that it falls back to ${oldestValue} by ${oldestLabel}.`
        : ' It is still climbing in the oldest group, which is unusual: in most countries here it has already turned down.';
      return rise + after;
    },

    /** Waar dit vandaan komt, en waarom het niet naast het paneel erboven mag liggen. */
    source: ({ wave, name, fieldwork, g }) =>
      `ECB Household Finance and Consumption Survey, wave ${wave}. Fieldwork in ` +
      `${g.withArticle(name)} ran ${fieldwork}. The survey does not count ` +
      'the value of public or occupational pension plans, so these figures sit at a different level ' +
      'from the quarterly accounts in the panel above — the two are not comparable with each other.',

    caption: ({ name, g }) =>
      `Net wealth by age of the reference person in ${g.withArticle(name)}: the middle (bar) and the average (line). ` +
      'Your amount is the marked line.',
    chartTitle: 'Net wealth by age of the reference person, with your amount marked',
  },

  /** Het woord bij de markering van je eigen bedrag in beide grafieken. */
  you: 'you',

  tryExample: ({ name, amount, g }) =>
    `Try the median household in ${g.withArticle(name)} (${amount}).`,

  share: {
    lines: ({ aboveIn, total, name, median, g }) => [
      `My household would sit above the median in ${aboveIn} of ${total} European countries.`,
      `In ${g.withArticle(name)} the median household is worth ${median}.`,
      'humanaverage.com/wealth',
    ],
    copied: 'Copied',
    prompt: 'Copy your result:',
  },
};
