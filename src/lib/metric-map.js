/**
 * Rekenwerk en zinnen voor de kaart (src/components/StageMap.astro) en zijn script:
 * welke waarde een land heeft onder de gekozen lens, waar het staat in de rangorde,
 * hoe ver van het Europese cijfer, en wat het detailpaneel daarover zegt.
 *
 * Zuivere functies, zodat de server (de HTML die er al staat) en de browser (wat er
 * na een klik verschijnt) hetzelfde antwoord geven en dit zonder browser te testen is.
 *
 * Alles wat per metriek verschilt komt binnen als `cfg`, de beschrijving uit
 * `src/lib/metrics/`. Dat is bewust een plat object zonder functies: de kaart zet
 * hem in een JSON-blok in de pagina, zodat het script in de browser met exact
 * dezelfde configuratie rekent als de server. Een formatteerfunctie zou die grens
 * niet over kunnen.
 *
 * Er staat geen getal met de hand in een zin. Wat hier als drempel staat (de
 * labelrijen van `tierOf`) gaat over tekengrootte, niet over statistiek.
 */
import { bandOf, formatAmount, formatValue, signed } from './metric.js';
import { periodLabel, periodNumber } from './period.js';
import { DEFAULT_LOCALE } from './locales.js';
import enCopy from '../locales/en/copy/metric-map.js';

/**
 * De zinnen per taal, net als NAMES in country-names.js en WORDS in metric-names.js.
 * Een taal erbij is de import hierboven en een sleutel hier; validate-i18n.mjs
 * vergelijkt deze sleutels met LOCALES.
 *
 * De taal komt uit `cfg.locale`. Dat is geen toeval en geen nieuwe leiding: de
 * metriekconfiguratie reist al als JSON-blok naar de browser (zie de kop hierboven),
 * en sinds fase 2 draagt hij zijn taal mee. Dus server en client lezen dezelfde taal
 * uit dezelfde bron, en kunnen per definitie niet uit elkaar lopen.
 */
const COPY = { en: enCopy };

const copyOf = (cfg) => COPY[cfg?.locale] ?? COPY[DEFAULT_LOCALE];

/** Welke talen hier zinnen hebben. Alleen voor de poort. */
export const COPY_LANGUAGES = Object.keys(COPY);

/** De code waarmee het detailpaneel het Europese cijfer aanwijst. Geen landcode van Eurostat, dus geen botsing. */
export const EU_CODE = 'EU';

export const band = (value, cfg) => bandOf(value, cfg.bands);

const lensOf = (cfg, lens) => cfg.lenses.find((entry) => entry.key === lens) ?? cfg.lenses[0];

/** De waarde van een rij onder een lens, of null als die er niet is. */
export function valueFor(row, lens) {
  const value = row[lens];
  return value === null || value === undefined ? null : value;
}

/**
 * Plek in de rangorde van laag naar hoog, onder een lens, alleen onder de landen op
 * het laatste jaar. Een land dat achterloopt krijgt geen plek: een jaar eerder is
 * geen vergelijking. Gelijke waarden delen dezelfde plek.
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
export function legendTicks(cfg) {
  return cfg.bands.slice(0, -1).map((bucket) => bucket.until);
}

/**
 * In welke labelrij een land valt, naar de ruimte die de geometrie voor een label
 * geeft (`lr` in data/geo/europe.json). Rij 0 past op elke breedte, rij 3 is te klein
 * voor een label en wordt altijd een knop onder de kaart. De stylesheet kiest per
 * breedte welke rijen een label tonen; hier staat alleen de indeling.
 */
export function tierOf(room) {
  if (room >= 40) return 0;
  if (room >= 17) return 1;
  if (room >= 13) return 2;
  return 3;
}

/** De samenvatting voor schermlezers; verandert mee met de lens. */
export function mapSummary(rows, latestYear, lens, cfg) {
  const current = rows
    .filter((row) => row.year === latestYear && valueFor(row, lens) !== null)
    .sort((a, b) => valueFor(a, lens) - valueFor(b, lens));
  const { who } = lensOf(cfg, lens);
  const subject = cfg.words.mapSubject.replace('{who}', who);
  const copy = copyOf(cfg);

  if (current.length === 0) return copy.mapSummary({ subject });

  const low = current[0];
  const high = current[current.length - 1];

  return copy.mapSummary({
    subject,
    period: periodLabel(latestYear),
    low: { name: low.name, value: formatValue(valueFor(low, lens), cfg) },
    high: { name: high.name, value: formatValue(valueFor(high, lens), cfg) },
  });
}

/**
 * Alles wat het detailpaneel (en de zwevende toelichting) over één land of over de EU
 * zegt. `data` is `{ latestYear, eu, rows }`. Geeft null als de code niet bestaat.
 *
 * Twee eerlijkheden die hier vastliggen: een land zonder cijfer voor het laatste jaar
 * krijgt geen plek in de rangorde en geen vergelijking met het Europese cijfer, want
 * zijn waarde komt uit een ander jaar; en het Europese cijfer zelf heeft geen plek,
 * want het is geen land.
 */
export function inspectFacts(data, code, lens = 'total', cfg) {
  const { rows, eu, latestYear } = data;
  const isEu = code === EU_CODE;
  const row = isEu ? eu : rows.find((entry) => entry.code === code);
  if (!row) return null;

  const { label } = lensOf(cfg, lens);
  const words = cfg.words;
  const copy = copyOf(cfg);
  const value = valueFor(row, lens);
  const behind = !isEu && row.year !== latestYear ? row.year : null;
  const rank = isEu || behind ? null : rankFor(rows, latestYear, code, lens);
  const delta = isEu || behind ? null : deltaVsEu(row, eu, lens);
  const gap = row.men !== null && row.women !== null ? row.men - row.women : null;

  const rankText = rank ? copy.rankNote({ rank: rank.rank, of: rank.of, words }) : '';

  // De drempel voor "gelijk aan het EU-cijfer" is een halve laatste decimaal: wat
  // daaronder ligt verdwijnt toch in de afronding.
  const tiny = 0.5 * 10 ** -(cfg.decimals ?? 1);

  const euText =
    delta === null
      ? ''
      : copy.euDistance({
          equal: Math.abs(delta) < tiny,
          amount: formatAmount(Math.abs(delta), cfg),
          higher: delta > 0,
          words,
        });

  let note = copy.joinNotes([rankText, euText]);
  if (isEu) note = words.euNote;
  else if (behind) note = copy.behindNote({ latest: periodLabel(latestYear), from: periodLabel(behind) });
  else if (value === null) note = copy.noFigure();

  /**
   * De breuken die het lijntje in het paneel werkelijk afbreken: alles ná de eerste
   * waarneming. De perioden blijven tekst, want `sparkline()` zoekt ze op in de reeks;
   * op een maandreeks gaf `Number('2025-01')` een NaN die door de filter viel, en dan
   * liep de lijn van Malta dwars door zijn eigen breuk.
   */
  const periods = Object.keys(row.series ?? {}).sort((a, b) => periodNumber(a) - periodNumber(b));
  const first = periods.length ? periodNumber(periods[0]) : Infinity;
  const breaks = (row.breaks ?? []).filter((period) => periodNumber(period) > first);

  return {
    code,
    name: isEu ? copy.euName : row.name,
    isEu,
    meta: copy.metaLine({ period: periodLabel(row.year), lensLabel: label }),
    value,
    valueText: formatValue(value, cfg),
    rank,
    note,
    men: row.men,
    women: row.women,
    gap,
    gapText: gap === null ? '—' : signed(gap, cfg),
    series: row.series ?? {},
    breaks,
    span: periods.length ? [periods[0], periods[periods.length - 1]] : null,
    /** De toelichting bij het trendlijntje: waarvoor het staat, en waar de lijn afbreekt en waarom. */
    sparkNote: copy.sparkNote({
      lensLabel: cfg.lenses[0].label,
      from: periods.length > 1 ? periodLabel(periods[0]) : null,
      to: periods.length > 1 ? periodLabel(periods[periods.length - 1]) : null,
      breaks: breaks.map(periodLabel),
      sourceName: cfg.sourceName,
    }),
  };
}
