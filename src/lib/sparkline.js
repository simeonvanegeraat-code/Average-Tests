/**
 * De meetkunde van een trendlijntje, met reeksbreuken.
 *
 * Eurostat vlagt breuken in de tijdreeks (in 2021 is de Labour Force Survey herzien en
 * vrijwel elk land heeft daar een breuk). Een lijn die over een breuk heen loopt toont een
 * sprong die niets betekent, dus die tekenen we niet: de lijn breekt af bij elk breukjaar,
 * en op die plek staat een kerfje onderaan. Het breukjaar zelf is de eerste waarneming
 * van de nieuwe reeks en begint dus een nieuw stuk.
 *
 * Dit is zuivere rekenkunde en geeft getallen terug, geen opmaak. De tabel gebruikt het
 * op de server (elke rij een lijntje), de kaart in de browser (het lijntje van het
 * gekozen land), en dan hoort er één definitie te zijn.
 */

const round = (n) => Math.round(n * 10) / 10;

/** De twee maten waarin het lijntje getekend wordt: in het detailpaneel van de kaart en in een tabelrij. */
export const SPARK_SIZES = {
  card: { width: 280, height: 56, pad: 4 },
  row: { width: 120, height: 26, pad: 4 },
};

/**
 * @param series  `{ "2000": 23.1, … }`, het totaal per jaar
 * @param breaks  jaren (tekst of getal) waarin de reeks breekt
 * @param options `width`, `height`, `pad` in viewBox-eenheden; `yearMin`/`yearMax` zetten
 *                alle lijntjes op dezelfde tijdas, zodat een korte reeks rechts uitgelijnd staat
 * @returns `{ d, lone, notches, last, width, height }` of null bij minder dan twee jaren
 */
export function sparkline(series, breaks = [], { width = 120, height = 26, pad = 4, yearMin, yearMax } = {}) {
  const years = Object.keys(series)
    .map(Number)
    .sort((a, b) => a - b);
  if (years.length < 2) return null;

  const values = years.map((year) => series[year]);
  const low = Math.min(...values) - 0.4;
  const high = Math.max(...values) + 0.4;
  const from = yearMin ?? years[0];
  const to = yearMax ?? years[years.length - 1];

  const x = (year) => pad + ((year - from) / (to - from || 1)) * (width - 2 * pad);
  const y = (value) => height - pad - ((value - low) / (high - low || 1)) * (height - 2 * pad);
  const point = (year) => ({ x: round(x(year)), y: round(y(series[year])) });

  const broken = new Set(breaks.map(Number));
  const segments = [];
  let current = [];
  years.forEach((year, i) => {
    if (i > 0 && broken.has(year)) {
      segments.push(current);
      current = [];
    }
    current.push(year);
  });
  segments.push(current);

  const d = segments
    .filter((segment) => segment.length > 1)
    .map((segment) =>
      segment
        .map((year, i) => {
          const p = point(year);
          return `${i ? 'L' : 'M'}${p.x} ${p.y}`;
        })
        .join(''),
    )
    .join('');

  return {
    d,
    /** Stukken van één waarneming krijgen een punt, anders is er niets te zien. */
    lone: segments.filter((segment) => segment.length === 1).map(([year]) => point(year)),
    /** Waar de reeks breekt: halverwege tussen het jaar ervoor en het breukjaar. */
    notches: years.filter((year, i) => i > 0 && broken.has(year)).map((year) => round(x(year - 0.5))),
    last: point(years[years.length - 1]),
    width,
    height,
  };
}

/**
 * De tekenelementen van een trendlijntje als gewone gegevens, `{ tag, attrs }`, voor
 * binnen een `<svg>`. De server maakt er elementen van in een sjabloon (RankTable), de
 * browser met createElementNS (het detailpaneel van de kaart); de opmaak van de lijn staat
 * dan op één plek. De kleur is `currentColor`, dus die zet de omgeving.
 *
 * Een stip op het laatste jaar zit er bewust niet bij: de `<svg>` rekt uit zonder de
 * verhoudingen te bewaren (`preserveAspectRatio="none"`), en een cirkel daarin wordt een
 * ovaal. Wie een stip wil zet er een element overheen op de plek van `spark.last`.
 */
export function sparkElements(spark) {
  const items = [];
  if (spark.d) {
    items.push({
      tag: 'path',
      attrs: {
        d: spark.d,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 2.2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'vector-effect': 'non-scaling-stroke',
      },
    });
  }
  for (const point of spark.lone) {
    items.push({ tag: 'circle', attrs: { cx: point.x, cy: point.y, r: 1.8, fill: 'currentColor' } });
  }
  for (const x of spark.notches) {
    items.push({
      tag: 'line',
      attrs: {
        x1: x,
        x2: x,
        y1: spark.height - 1,
        y2: spark.height - 8,
        stroke: 'currentColor',
        'stroke-opacity': 0.55,
        'stroke-width': 1.4,
        'vector-effect': 'non-scaling-stroke',
      },
    });
  }
  return items;
}
