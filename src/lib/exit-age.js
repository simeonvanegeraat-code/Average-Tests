/**
 * De tweede sectie op /pension-age/: de feitelijke uittreedleeftijd van de OECD.
 *
 * Waarom er twee bronnen op één pagina staan. Eurostat zegt wanneer mensen hun
 * ouderdomspensioen zijn gaan ontvangen; de OECD zegt wanneer mensen de
 * arbeidsmarkt verlaten. Dat zijn twee vragen, niet twee metingen van hetzelfde, en
 * ze mogen niet van elkaar worden afgetrokken: Eurostat vraagt het aan de
 * pensioenontvangers van nu en kijkt dus decennia terug, de OECD leidt zijn cijfer
 * af uit de arbeidsdeelname van dít jaar. Wat de OECD toevoegt is bereik — 51
 * landen, waarvan achttien buiten Europa, en een reeks vanaf 1970.
 *
 * Er is **geen totaal**. De OECD publiceert ELMEA alleen per geslacht, dus alles
 * hieronder houdt mannen en vrouwen apart. Een gemiddelde van de twee zou een
 * getal zijn dat nergens gepubliceerd is.
 */

const rond = (value, decimals = 1) => Math.round(value * 10 ** decimals) / 10 ** decimals;

/**
 * Landen in de OECD-reeks die buiten Europa liggen.
 *
 * Verwijzingsgegevens, geen statistiek: de lijst dient één zin, namelijk wat deze
 * bron toevoegt aan een site die verder alleen Europa toont. Türkiye en Rusland
 * staan er niet in, omdat ze in de Europese statistiek meelopen — Eurostat
 * publiceert ze in dezelfde tabellen als de EU-landen.
 */
const BEYOND_EUROPE = new Set([
  'ARG', 'AUS', 'BRA', 'CAN', 'CHL', 'CHN', 'COL', 'CRI', 'IDN', 'IND',
  'ISR', 'JPN', 'KOR', 'MEX', 'NZL', 'SAU', 'USA', 'ZAF',
]);

/**
 * Het dieptepunt in een reeks en wat er sindsdien bij is gekomen.
 *
 * Mag hier gewoon over de hele reeks: de OECD vlagt geen enkele waarneming als
 * breuk of schatting — alles staat op OBS_STATUS A, en scripts/validate-oecd.mjs
 * valt om zodra dat verandert. Bij Eurostat kon dit niet, en daar weigert
 * `trend()` in src/lib/metric.js dan ook te rekenen.
 */
function lowPoint(series, year) {
  const years = Object.keys(series).sort();
  if (!years.length) return null;

  const low = years.reduce((lowest, each) => (series[each] < series[lowest] ? each : lowest), years[0]);
  const now = series[year] ?? series[years[years.length - 1]];

  return {
    from: years[0],
    low,
    lowValue: series[low],
    now,
    risen: rond(now - series[low]),
    fell: rond(series[years[0]] - series[low]),
    start: series[years[0]],
  };
}

export function exitAge(index) {
  const countries = index.countries;
  const named = (code) => index.aggregates.find((area) => area.code === code) ?? null;
  const withLow = (area) => (area ? { ...area, low: lowPoint(area.series.men, area.year), lowWomen: lowPoint(area.series.women, area.year) } : null);

  const menLater = countries.filter((country) => country.gap > 0);
  const womenLater = countries.filter((country) => country.gap < 0);
  const meanGap = rond(countries.reduce((sum, country) => sum + country.gap, 0) / countries.length, 2);
  const widest = [...countries].sort((a, b) => b.gap - a.gap)[0];

  /** Alleen de landen die de hele reeks dragen; de rest begint later en heeft geen dieptepunt om vanaf te rekenen. */
  const full = countries
    .map((country) => ({ ...country, low: lowPoint(country.series.men, country.year) }))
    .filter((country) => country.low && country.low.from === index.years[0]);

  const decades = new Map();
  for (const country of full) {
    const decade = `${Math.floor(Number(country.low.low) / 10) * 10}s`;
    decades.set(decade, (decades.get(decade) ?? 0) + 1);
  }

  const byMen = [...countries].sort((a, b) => a.men - b.men);

  return {
    of: countries.length,
    year: index.latestYear,
    from: index.years[0],
    until: index.years[index.years.length - 1],
    eu: withLow(named('EU27')),
    oecd: withLow(named('OECD_REP')),

    menLater,
    womenLater,
    meanGap,
    widest,

    beyond: countries.filter((country) => BEYOND_EUROPE.has(country.code)).sort((a, b) => b.men - a.men),

    lowest: byMen.slice(0, 3),
    highest: byMen.slice(-3).reverse(),

    full: {
      of: full.length,
      risen: full.filter((country) => country.low.risen > 0).length,
      meanRise: rond(full.reduce((sum, country) => sum + country.low.risen, 0) / full.length),
      climbs: [...full].sort((a, b) => b.low.risen - a.low.risen).slice(0, 4),
      /** Het decennium waarin het dieptepunt viel, van vroeg naar laat. */
      decades: [...decades].sort((a, b) => a[0].localeCompare(b[0])),
      peak: [...decades].sort((a, b) => b[1] - a[1])[0],
    },

    /** Landen die niet tot het laatste jaar rapporteren; elk draagt zijn eigen jaar. */
    stale: countries.filter((country) => country.year !== index.latestYear).sort((a, b) => b.year.localeCompare(a.year)),
  };
}

/** Elk land, van laat naar vroeg op de mannencijfers, voor de tabel. */
export function exitAgeRows(index) {
  return [...index.countries].sort((a, b) => b.men - a.men);
}

/**
 * De bronvermelding in de vorm die de OECD voorschrijft.
 *
 * Hergebruik mag ook commercieel, maar niet zonder dit: "you must cite the source
 * information using the following format: OECD (year), (dataset name),(data source)
 * DOI or URL (accessed on (date))" (voorwaarden gelezen op 25 oktober 2026). Daarom
 * staat de vorm hier, opgebouwd uit het source-blok in plaats van ingetypt — en
 * daarom staat hij op de pagina en niet alleen in data/sources.md.
 */
export function citation(index) {
  const source = index.source ?? {};
  const day = (source.fetchedOn ?? '').slice(0, 10);

  return {
    before: `OECD (${day.slice(0, 4)}), ${source.name ?? source.label}, OECD Data Explorer, `,
    url: source.explorer ?? source.url,
    after: ` (accessed on ${day})`,
    terms: source.terms ?? null,
  };
}
