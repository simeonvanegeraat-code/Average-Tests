/**
 * Bouwt data/exit-age/index.json uit het ruwe OECD-antwoord.
 *
 * Mannen en vrouwen staan naast elkaar en worden nooit gemiddeld: de OECD
 * publiceert geen totaal, en het verschil loopt op tot bijna twaalf jaar. Een eigen
 * gemiddelde zou een getal zijn dat nergens gepubliceerd is.
 *
 * Elk gebied draagt zijn eigen jaar — de reeks loopt van 1970 tot 2024 maar niet elk
 * land rapporteert tot het eind — en binnen een gebied komen beide geslachten uit
 * datzelfde jaar.
 *
 * De hele reeks gaat mee, niet alleen het laatste jaar. Dat is wat deze bron
 * toevoegt aan de Eurostat-kop erboven: 55 jaargangen, en de OECD vlagt geen enkele
 * waarneming als breuk of schatting (alles staat op OBS_STATUS A, en pairSeries
 * weigert de rest). De aggregaten EU27 en OECD staan apart, zoals bij Eurostat.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readObservations, pairSeries, isCountry } from './lib/oecd.mjs';
import { PENSION } from './oecd.mjs';

const RAW = new URL('../data/raw/oecd/', import.meta.url);
const OUT = new URL('../data/exit-age/', import.meta.url);

const rond = (value) => Math.round(value * 100) / 100;

/** Mannen min vrouwen, uit hetzelfde jaar. Positief betekent dat mannen later stoppen. */
const withGap = (area) => ({ ...area, gap: rond(area.men - area.women) });

async function main() {
  const raw = JSON.parse(await readFile(new URL(`${PENSION.key}.json`, RAW), 'utf8'));
  const { rows, times } = readObservations(raw.json);

  const countries = pairSeries(rows).map(withGap);
  const aggregates = pairSeries(rows, { include: (code) => !isCountry(code) }).map(withGap);

  const latestYear = countries.reduce((max, area) => (Number(area.year) > Number(max) ? area.year : max), '0');

  /**
   * De woorden van de uitgever zelf, net als bij Eurostat: /method/ citeert ze en
   * vat ze niet samen. `name` is de dataflow ("Pensions at a glance"), `label` de
   * maat eruit ("Effective labour market exit age").
   */
  const structure = (raw.json.data ?? raw.json).structure ?? {};

  const index = {
    source: {
      publisher: 'OECD',
      dataset: PENSION.dataflow,
      measure: PENSION.measure,
      label: PENSION.label,
      name: structure.name ?? null,
      description: structure.description ?? null,
      url: raw.url,
      explorer: PENSION.explorer,
      terms: PENSION.terms,
      fetchedOn: raw.fetchedOn,
    },
    latestYear,
    years: times,
    countries,
    aggregates,
    /** Hoeveel landen rapporteren tot het laatste jaar van de reeks. */
    countriesAtLatestYear: countries.filter((area) => area.year === latestYear).length,
  };

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL('index.json', OUT), JSON.stringify(index) + '\n');

  const vroegste = countries[0];
  const laatste = countries[countries.length - 1];
  console.log(
    `exit-age   ${countries.length} landen, ${times[0]}-${times[times.length - 1]}, ` +
      `${vroegste.code} ${vroegste.men} ... ${laatste.code} ${laatste.men} (mannen), ` +
      `aggregaten ${aggregates.map((area) => area.code).join('/')}`,
  );
}

await main();
