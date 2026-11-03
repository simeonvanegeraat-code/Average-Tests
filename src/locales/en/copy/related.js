/**
 * De Engelse zinnen van "Waar dit cijfer aan vastzit".
 *
 * `src/lib/related.js` kiest de paren en rekent de uitersten en de kruisingen uit; dit
 * bestand verwoordt ze. Welke metriek bij welke hoort is een eigenschap van de data (de
 * correlatie koos het paar) en staat daarom dáár, niet hier.
 *
 * Elke functie krijgt dezelfde gereedschapskist:
 *
 *   e           de uitersten van dit paar: { low, high, of }, met .from en .to
 *   cross       de landen waar beide metrieken een cijfer hebben
 *   show(k, v)  een waarde opgemaakt in de eenheid van metriek k, in deze taal
 *   g           de grammatica van deze taal (withArticle, ordinal, …)
 *   crossings   voor de twee zinnen die een ander paar moeten kruisen dan hun eigen
 *
 * Er staat geen getal met de hand in. Elk cijfer komt door `show()`, dus in de notatie
 * van deze taal.
 */

export default {
  'leaving-home': {
    'household-size': ({ e, show, g }) =>
      `Where people leave latest, households are fullest: ${g.withArticle(e.high.name, { capitalise: true })} at ${show('leaving-home', e.high.from)} ` +
      `has ${show('household-size', e.high.to)} people per household, against ${show('household-size', e.low.to)} in ` +
      `${e.low.name}, where half have left by ${show('leaving-home', e.low.from)}.`,

    'working-life': ({ e, show, g }) =>
      `Leaving late does not mean working less: ${g.withArticle(e.low.name, { capitalise: true })} combines the earliest exit from home ` +
      `(${show('leaving-home', e.low.from)}) with ${show('working-life', e.low.to)} years in the labour market, while ` +
      `${e.high.name} pairs ${show('leaving-home', e.high.from)} with ${show('working-life', e.high.to)}.`,
  },

  'household-size': {
    'dwelling-size': ({ e, show }) =>
      `A household of ${show('household-size', e.high.from)} in ${e.high.name} has ${show('dwelling-size', e.high.to)} m² ` +
      `to share; one of ${show('household-size', e.low.from)} in ${e.low.name} has ${show('dwelling-size', e.low.to)} m². ` +
      `That page divides the one by the other.`,

    'leaving-home': ({ e, show }) =>
      `Big households and late departures travel together: ${e.high.name} has ${show('household-size', e.high.from)} ` +
      `people per household and half of young people still at home until ${show('leaving-home', e.high.to)}.`,
  },

  'dwelling-size': {
    'household-size': ({ e, show }) =>
      `Floor space says little until you know how many people share it: ${e.high.name} has the largest homes at ` +
      `${show('dwelling-size', e.high.from)} m² and ${show('household-size', e.high.to)} people in them.`,

    wealth: ({ e, show }) =>
      `Property is the largest holding of most European households, and it shows: ${e.high.name} pairs ` +
      `${show('dwelling-size', e.high.from)} m² with a median household worth ${show('wealth', e.high.to)}, against ` +
      `${show('dwelling-size', e.low.from)} m² and ${show('wealth', e.low.to)} in ${e.low.name}.`,

    'first-child': ({ e, show }) =>
      `Bigger homes and later first children sit on the same side of Europe: ${e.high.name} averages ` +
      `${show('dwelling-size', e.high.from)} m² and a first child at ${show('first-child', e.high.to)}, against ` +
      `${show('dwelling-size', e.low.from)} m² and ${show('first-child', e.low.to)} in ${e.low.name}.`,
  },

  'working-life': {
    'working-hours': ({ e, show, g }) =>
      `The longest career has the shortest week: ${g.withArticle(e.high.name)} expects ${show('working-life', e.high.from)} ` +
      `years in work at ${show('working-hours', e.high.to)} hours, while ${g.withArticle(e.low.name)} expects ` +
      `${show('working-life', e.low.from)} years at ${show('working-hours', e.low.to)}.`,

    'pension-age': ({ e, show, g }) =>
      `A long working life and a late pension go together: ${g.withArticle(e.high.name)} has ${show('working-life', e.high.from)} ` +
      `years in the labour market and a pension that starts at ${show('pension-age', e.high.to)}; ${e.low.name} has ` +
      `${show('working-life', e.low.from)} years and ${show('pension-age', e.low.to)}.`,
  },

  'working-hours': {
    'working-life': ({ e, show, g }) =>
      `Short weeks do not mean short careers. ${g.withArticle(e.low.name, { capitalise: true })} works ${show('working-hours', e.low.from)} hours ` +
      `and still expects ${show('working-life', e.low.to)} years in the labour market — more than ${e.high.name}, ` +
      `where the week runs ${show('working-hours', e.high.from)} hours.`,

    'leaving-home': ({ e, show }) =>
      `The countries with the longest weeks are also the ones where people leave home latest: ${e.high.name} at ` +
      `${show('working-hours', e.high.from)} hours and ${show('leaving-home', e.high.to)}.`,
  },

  unemployment: {
    'leaving-home': ({ cross, show, g }) => {
      const byAge = [...cross.rows].sort((a, b) => a.b - b.b);
      const early = byAge[0];
      const late = byAge[byAge.length - 1];
      return (
        `A hard job market is supposed to keep young people at home, and across these ${cross.of} ` +
        `countries it does not show up at all. ${g.withArticle(early.name, { capitalise: true })} has the ` +
        `earliest departure in Europe, ${show('leaving-home', early.b)}, with ` +
        `${show('unemployment', early.a)}% unemployment; ${late.name} has the latest, ` +
        `${show('leaving-home', late.b)}, with ${show('unemployment', late.a)}%.`
      );
    },

    'working-life': ({ cross, show, g }) => {
      const byRate = [...cross.rows].sort((a, b) => a.a - b.a);
      const middle = byRate[Math.floor(byRate.length / 2)].a;
      const above = byRate.filter((row) => row.a >= middle);
      const counter = above.reduce((top, row) => (row.b > top.b ? row : top), above[0]);
      const lowest = byRate[0];
      return (
        `Looking for work still counts as being in the labour force, so a high rate here takes ` +
        `nothing off the working life behind it. ${g.withArticle(counter.name, { capitalise: true })} expects ` +
        `${show('working-life', counter.b)} years in the labour market at ${show('unemployment', counter.a)}% ` +
        `unemployment; ${g.withArticle(lowest.name)}, with the lowest rate here at ` +
        `${show('unemployment', lowest.a)}%, expects ${show('working-life', lowest.b)}.`
      );
    },
  },

  'pension-age': {
    'healthy-years': ({ crossings, show, g }) => {
      const cross = crossings('healthy-years', 'pension-age');
      return (
        `In ${cross.under} of these ${cross.of} countries the healthy years run out before the pension starts. The ` +
        `widest gap is ${g.withArticle(cross.widest.name)}: ${show('healthy-years', cross.widest.a)} healthy years ` +
        `against a pension that begins at ${show('pension-age', cross.widest.b)}.`
      );
    },

    'working-life': ({ e, show, g }) =>
      `The later the pension, the longer the working life behind it: ${g.withArticle(e.high.name)} starts at ` +
      `${show('pension-age', e.high.from)} after ${show('working-life', e.high.to)} years in work.`,
  },

  'healthy-years': {
    'pension-age': ({ crossings, show, g }) => {
      const cross = crossings('healthy-years', 'pension-age');
      return (
        `Healthy years and pension age do not move together. In ${cross.under} of these ${cross.of} countries the ` +
        `healthy years end first — ${g.withArticle(cross.widest.name)} by ${show('healthy-years', Math.abs(cross.widest.gap))} years.`
      );
    },

    'working-life': ({ e, show, g }) =>
      `${g.withArticle(e.high.name, { capitalise: true })} has the most healthy years (${show('healthy-years', e.high.from)}) and one of the ` +
      `shortest working lives (${show('working-life', e.high.to)} years); ${e.low.name} has the fewest ` +
      `(${show('healthy-years', e.low.from)}) and spends ${show('working-life', e.low.to)} years at work.`,
  },

  'first-child': {
    'leaving-home': ({ crossings, show, g }) => {
      const cross = crossings('first-child', 'leaving-home');
      return (
        `In ${cross.under} of these ${cross.of} countries the first child arrives before the parental home is left. ` +
        `${g.withArticle(cross.widest.name, { capitalise: true })} is the furthest: a first child at ` +
        `${show('first-child', cross.widest.a)}, the midpoint for leaving home at ${show('leaving-home', cross.widest.b)}.`
      );
    },

    'dwelling-size': ({ e, show }) =>
      `Later first children and larger homes sit on the same side of Europe: ${e.high.name} at ` +
      `${show('first-child', e.high.from)} and ${show('dwelling-size', e.high.to)} m².`,
  },

  wealth: {
    'dwelling-size': ({ e, show }) =>
      `Most of that wealth is the home it is measured in: ${e.high.name}, with a median household worth ` +
      `${show('wealth', e.high.from)}, averages ${show('dwelling-size', e.high.to)} m² of floor space.`,

    'household-size': ({ e, show }) =>
      `Wealth is counted per household, so household size is part of the answer: ${e.high.name} has ` +
      `${show('household-size', e.high.to)} people behind its ${show('wealth', e.high.from)}, ${e.low.name} ` +
      `${show('household-size', e.low.to)} behind ${show('wealth', e.low.from)}.`,
  },
};
