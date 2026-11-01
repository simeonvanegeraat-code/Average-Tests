/**
 * Werkloosheid onder de 25 naast werkloosheid van 25 tot 74.
 *
 * Twee bestanden uit dezelfde Eurostat-dataset, maar niet uit dezelfde doorsnede, en
 * daar zit het werk. Drie dingen lopen per leeftijdsklasse uiteen en alle drie zouden
 * ze een stille fout geven:
 *
 * 1. **De maand.** Elk land draagt zijn eigen laatste maand, en die hoeft tussen de twee
 *    reeksen niet gelijk te zijn: Roemenië heeft juni in de jeugdreeks en september in
 *    de andere, Italië andersom. Een verhouding tussen twee maanden is geen verhouding,
 *    dus `pairs()` eist dezelfde periode en geeft de rest apart terug.
 * 2. **De breuken.** De jeugdreeks draagt Tsjechië 2023-06 bovenop de twee die beide
 *    reeksen hebben. Het vergelijkbare venster wordt per bestand uitgerekend; hier wordt
 *    niets over een breuk heen gerekend, want elke uitspraak gaat over één moment.
 * 3. **De dekking.** Beide reeksen hebben landen die de andere niet heeft op dezelfde
 *    maand. Wie wegvalt hoort op de pagina te staan en niet stil te verdwijnen.
 */
import { currentCountries } from './metric.js';

/**
 * De landen die in beide reeksen op dezelfde maand staan, met hun verhouding.
 *
 * `skipped` draagt de rest, met de reden erbij: of het land ontbreekt in een van de twee,
 * of de twee cijfers staan op verschillende maanden.
 */
export function pairs(youth, older) {
  const byCode = new Map(older.countries.map((country) => [country.code, country]));
  const matched = [];
  const skipped = [];

  for (const young of youth.countries) {
    const old = byCode.get(young.code);
    if (!old) {
      skipped.push({ code: young.code, name: young.name, reason: 'missing' });
      continue;
    }
    if (young.year !== old.year) {
      skipped.push({
        code: young.code,
        name: young.name,
        reason: 'different-month',
        youthPeriod: young.year,
        olderPeriod: old.year,
      });
      continue;
    }
    matched.push({
      code: young.code,
      name: young.name,
      period: young.year,
      youth: young.total,
      older: old.total,
      youthMen: young.men,
      youthWomen: young.women,
      ratio: old.total > 0 ? young.total / old.total : null,
      difference: young.total - old.total,
    });
  }

  return { matched: matched.sort((a, b) => b.youth - a.youth), skipped };
}

/** Hetzelfde paar voor een aggregaat, bijvoorbeeld de EU. Null als het niet op dezelfde maand staat. */
export function aggregatePair(youth, older, code = 'EU27_2020') {
  const young = youth.aggregates?.find((a) => a.code === code);
  const old = older.aggregates?.find((a) => a.code === code);
  if (!young || !old || young.year !== old.year) return null;
  return {
    code,
    period: young.year,
    youth: young.total,
    older: old.total,
    youthMen: young.men,
    youthWomen: young.women,
    ratio: old.total > 0 ? young.total / old.total : null,
  };
}

/**
 * Hoeveel plaatsen een land verschuift als je op de jeugdcijfers rangschikt in plaats
 * van op het totaal.
 *
 * Dit is wat deze pagina te vertellen heeft en wat nergens anders staat: "welk land is
 * het slechtst voor werklozen" heeft een ander antwoord naargelang je leeftijd. De
 * vergelijking loopt tegen het totáál en niet tegen de groep van 25 tot 74, want het
 * totaal is wat de bezoeker op /unemployment/ net gezien heeft.
 *
 * Alleen landen die in beide ranglijsten staan tellen mee; een land dat in één van de
 * twee ontbreekt zou alle plaatsen eronder laten opschuiven.
 */
export function rankShift(matched, totalIndex) {
  const total = currentCountries(totalIndex);
  const inBoth = matched.filter((row) => total.some((country) => country.code === row.code));

  const byTotal = [...total]
    .filter((country) => inBoth.some((row) => row.code === country.code))
    .sort((a, b) => b.total - a.total)
    .map((country) => country.code);
  const byYouth = [...inBoth].sort((a, b) => b.youth - a.youth).map((row) => row.code);

  const shifts = inBoth.map((row) => ({
    ...row,
    rankTotal: byTotal.indexOf(row.code) + 1,
    rankYouth: byYouth.indexOf(row.code) + 1,
    /** Positief is hoger in de jeugdlijst dan in de totaallijst, dus slechter voor jongeren. */
    shift: byTotal.indexOf(row.code) - byYouth.indexOf(row.code),
  }));

  return {
    of: shifts.length,
    shifts,
    /** De grootste verschuivingen, beide kanten op, grootste eerst. */
    movers: [...shifts].sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift)),
    unchanged: shifts.filter((row) => row.shift === 0).length,
  };
}

/**
 * Landen waar de leeftijdskloof bínnen het land groter is dan de afstand tussen het
 * laagste en het hoogste land van Europa.
 *
 * Dit bestaat omdat de verleiding groot is om te schrijven dat leeftijd "meer uitmaakt
 * dan welk land dan ook". Dat is onwaar: de landenspreiding op de hoofdpagina is 3,9x en
 * de leeftijdskloof in de EU 2,9x. Wat wél waar is, is dit — en het is te tellen.
 */
export function widerThanSpread(matched, totalIndex) {
  const current = currentCountries(totalIndex);
  if (current.length < 2) return null;
  const totals = current.map((country) => country.total).sort((a, b) => a - b);
  const spread = totals[0] > 0 ? totals[totals.length - 1] / totals[0] : null;
  if (!spread) return null;
  return {
    spread,
    low: totals[0],
    high: totals[totals.length - 1],
    countries: matched.filter((row) => Number.isFinite(row.ratio) && row.ratio > spread),
    of: matched.length,
  };
}

/** De breedste en de smalste leeftijdskloof, en het midden ertussen. */
export function gapRange(matched) {
  const withRatio = matched.filter((row) => Number.isFinite(row.ratio)).sort((a, b) => a.ratio - b.ratio);
  if (withRatio.length === 0) return null;
  return {
    of: withRatio.length,
    narrowest: withRatio[0],
    widest: withRatio[withRatio.length - 1],
    middle: withRatio[Math.floor(withRatio.length / 2)],
  };
}

/**
 * Het verschil tussen mannen en vrouwen binnen de jongste groep, tegenover datzelfde
 * verschil in de hele beroepsbevolking. Geeft null als een van de twee ontbreekt.
 */
export function sexGap(pair, totalIndex, code = 'EU27_2020') {
  const whole = totalIndex.aggregates?.find((a) => a.code === code);
  if (!pair || pair.youthMen === null || pair.youthWomen === null) return null;
  if (!whole || whole.men === null || whole.women === null) return null;
  return {
    youth: { men: pair.youthMen, women: pair.youthWomen, gap: pair.youthWomen - pair.youthMen },
    everyone: { men: whole.men, women: whole.women, gap: whole.women - whole.men },
    period: pair.period,
  };
}
