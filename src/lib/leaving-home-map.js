/**
 * Rekenwerk en zinnen voor de kaart (src/components/StageMap.astro) en zijn script: welke
 * waarde een land heeft onder de gekozen lens, waar het staat in de rangorde, hoe ver van
 * het Europese cijfer, en wat het detailpaneel daarover zegt. Zuivere functies, zodat de
 * server (de HTML die er al staat) en de browser (wat er na een klik verschijnt) hetzelfde
 * antwoord geven en dit zonder browser te testen is.
 *
 * De klassegrenzen komen uit BANDS in src/lib/leaving-home.js. Het script van de kaart
 * importeert ze ook van daar; de oude kaart had ze in twee lijsten die gelijk moesten
 * blijven, deze heeft er één.
 *
 * Er staat geen getal met de hand in een zin. Wat hier als drempel staat (de labelrijen
 * van `tierOf`) gaat over tekengrootte, niet over statistiek.
 */
import { BANDS, band, age, years, withArticle } from './leaving-home.js';

export { BANDS, band };

/** De code waarmee het detailpaneel het Europese cijfer aanwijst. Geen landcode van Eurostat, dus geen botsing. */
export const EU_CODE = 'EU';

/** De drie lenzen: iedereen, mannen, vrouwen. `key` is de naam van het veld in de gegevens. */
export const LENSES = [
  { key: 'total', label: 'Everyone', who: 'young people' },
  { key: 'men', label: 'Men', who: 'young men' },
  { key: 'women', label: 'Women', who: 'young women' },
];

const lensOf = (lens) => LENSES.find((entry) => entry.key === lens) ?? LENSES[0];

/** De waarde van een rij onder een lens, of null als die er niet is. */
export function valueFor(row, lens) {
  const value = row[lens];
  return value === null || value === undefined ? null : value;
}

/**
 * Plek in de rangorde van vroeg naar laat, onder een lens, alleen onder de landen op het
 * laatste jaar. Een land dat achterloopt krijgt geen plek: een jaar eerder is geen
 * vergelijking. Gelijke waarden delen dezelfde plek.
 */
export function rankFor(rows, latestYear, code, lens) {
  const current = rows.filter((row) => row.year === latestYear && valueFor(row, lens) !== null);
  const own = current.find((row) => row.code === code);
  if (!own) return null;
  const value = valueFor(own, lens);
  return { rank: 1 + current.filter((row) => valueFor(row, lens) < value).length, of: current.length };
}

/** Verschil met het Europese cijfer onder dezelfde lens, of null als een van beide ontbreekt. */
export function deltaVsEu(row, eu, lens) {
  const value = valueFor(row, lens);
  const reference = eu ? (eu[lens] ?? null) : null;
  return value === null || reference === null ? null : value - reference;
}

/** De getallen op de grenzen van de legenda: alles behalve de bovengrens van de laatste klasse. */
export function legendTicks() {
  return BANDS.slice(0, -1).map((bucket) => bucket.until);
}

/**
 * In welke labelrij een land valt, naar de ruimte die de geometrie voor een label geeft
 * (`lr` in data/geo/europe.json). Rij 0 past op elke breedte, rij 3 is te klein voor een
 * label en wordt altijd een knop onder de kaart. De stylesheet kiest per breedte van de
 * kaart welke rijen een label tonen en welke een knop; hier staat alleen de indeling.
 */
export function tierOf(room) {
  if (room >= 40) return 0;
  if (room >= 17) return 1;
  if (room >= 13) return 2;
  return 3;
}

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st. */
export function ordinal(n) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
}

const signed = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}`;

/** De samenvatting voor schermlezers; verandert mee met de lens. */
export function mapSummary(rows, latestYear, lens) {
  const current = rows
    .filter((row) => row.year === latestYear && valueFor(row, lens) !== null)
    .sort((a, b) => valueFor(a, lens) - valueFor(b, lens));
  const { who } = lensOf(lens);
  if (current.length === 0) return `Map of Europe: the age by which half of ${who} have left the parental home.`;

  const low = current[0];
  const high = current[current.length - 1];
  return (
    `Map of Europe: the age by which half of ${who} have left the parental home, ${latestYear}. ` +
    `It ranges from ${age(valueFor(low, lens))} in ${withArticle(low.name)} to ${age(valueFor(high, lens))} in ${withArticle(high.name)}. ` +
    'Every figure is also in the table below the map.'
  );
}

/**
 * Alles wat het detailpaneel (en de zwevende toelichting) over één land of over de EU zegt.
 *
 * `data` is `{ latestYear, eu, rows }`: de rijen van index.json, en de EU-rij uit
 * `aggregates`. Geeft null als de code niet bestaat.
 *
 * Twee eerlijkheden die hier vastliggen: een land zonder cijfer voor het laatste jaar krijgt
 * geen plek in de rangorde en geen vergelijking met het Europese cijfer, want zijn waarde
 * komt uit een ander jaar; en het Europese cijfer zelf heeft geen plek, want het is geen land.
 */
export function inspectFacts(data, code, lens = 'total') {
  const { rows, eu, latestYear } = data;
  const isEu = code === EU_CODE;
  const row = isEu ? eu : rows.find((entry) => entry.code === code);
  if (!row) return null;

  const { label } = lensOf(lens);
  const value = valueFor(row, lens);
  const behind = !isEu && row.year !== latestYear ? row.year : null;
  const rank = isEu || behind ? null : rankFor(rows, latestYear, code, lens);
  const delta = isEu || behind ? null : deltaVsEu(row, eu, lens);
  const gap = row.men !== null && row.women !== null ? row.men - row.women : null;

  let rankText = '';
  if (rank) {
    if (rank.rank === 1) rankText = `Earliest of ${rank.of} countries`;
    else if (rank.rank === rank.of) rankText = `Latest of ${rank.of} countries`;
    else rankText = `${ordinal(rank.rank)} earliest of ${rank.of} countries`;
  }

  let euText = '';
  if (delta !== null) {
    euText = Math.abs(delta) < 0.05 ? 'right on the EU figure' : `${years(Math.abs(delta))} ${delta > 0 ? 'later' : 'earlier'} than the EU figure`;
  }

  let note = [rankText, euText].filter(Boolean).join(' · ');
  if (isEu) note = "Eurostat's figure for the European Union.";
  else if (behind) note = `No ${latestYear} figure. This is the latest, from ${behind}, and it is not ranked.`;
  else if (value === null) note = 'No figure for this group.';

  const seriesYears = Object.keys(row.series ?? {}).map(Number);
  const breaks = (row.breaks ?? []).map(Number).filter((year) => year > Math.min(...seriesYears));

  return {
    code,
    name: isEu ? 'European Union' : row.name,
    isEu,
    meta: `${row.year} · ${label}`,
    value,
    valueText: age(value),
    rank,
    note,
    men: row.men,
    women: row.women,
    gap,
    gapText: gap === null ? '—' : signed(gap),
    series: row.series ?? {},
    breaks,
    span: seriesYears.length ? [Math.min(...seriesYears), Math.max(...seriesYears)] : null,
    /** De toelichting bij het trendlijntje: waarvoor het staat, en waar de lijn afbreekt en waarom. */
    sparkNote: [
      seriesYears.length > 1 ? `Everyone, ${Math.min(...seriesYears)}–${Math.max(...seriesYears)}.` : '',
      breaks.length === 0 ? '' : `Notches mark Eurostat series breaks (${breaks.join(', ')}). The line is not drawn across them.`,
    ]
      .filter(Boolean)
      .join(' '),
  };
}
