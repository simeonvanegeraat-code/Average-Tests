/**
 * Bouwt data/leaving-home/index.json uit het ruwe Eurostat-antwoord.
 *
 *   node scripts/fetch-eurostat.mjs && node scripts/build-leaving-home.mjs
 *
 * Drie keuzes die het verschil maken tussen een eerlijke en een misleidende pagina:
 *
 * 1. Aggregaten (EU27, eurozone) staan in dezelfde geo-dimensie als landen, maar
 *    het zijn geen landen. Ze gaan in een apart veld, zodat niets ze per ongeluk
 *    meetelt in "het vroegste land" of in een landental.
 *
 * 2. Niet elk land staat op hetzelfde jaar. Het VK stopt in 2019, Montenegro in
 *    2020, Türkiye in 2024. Elk land draagt daarom zijn eigen jaar mee, en het
 *    cijfer in de kop wordt alleen over de landen van het laatste jaar berekend.
 *
 * 3. **De reeks heeft breuken.** Eurostat vlagt waarnemingen met `b` ("break in
 *    time series"); in 2021 is de Labour Force Survey herzien en vrijwel elk land
 *    heeft daar een breuk. Erger nog: het breukjaar zelf is vaak een overgangsjaar
 *    (Portugal 33,3 in 2021, 30,1 in 2022, 28,9 in 2019; Zweden springt van 17,5
 *    naar 22,0). Daarom leggen we per gebied de breukjaren vast en berekenen we
 *    `comparableSince`: het eerste jaar ná de laatste breuk. Alles daarvoor mag
 *    niet met nu vergeleken worden, en de pagina gebruikt dat veld in plaats van
 *    een jaartal dat iemand mooi vond.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { reader, datasetUrl, AGGREGATES, RAW_DIR } from './lib/eurostat.mjs';

const CODE = 'yth_demo_030';
const OUT_DIR = new URL('../data/leaving-home/', import.meta.url);

const json = JSON.parse(await readFile(new URL(`${CODE}.json`, RAW_DIR), 'utf8'));
const log = JSON.parse(await readFile(new URL('fetch-log.json', RAW_DIR), 'utf8'));
const data = reader(json);

const years = data.categories('time');
const fixed = { freq: 'A', unit: 'AVG' };
const at = (geo, time, sex = 'T') => data.at({ ...fixed, sex, geo, time });
const flagAt = (geo, time, sex = 'T') => data.statusAt({ ...fixed, sex, geo, time });

function entry(geo) {
  let year = null;
  for (let i = years.length - 1; i >= 0; i -= 1) {
    if (at(geo, years[i]) !== undefined) { year = years[i]; break; }
  }
  if (!year) return null;

  const series = {};
  for (const time of years) {
    const value = at(geo, time);
    if (value !== undefined) series[time] = value;
  }

  return {
    code: geo,
    name: data.labelOf('geo', geo),
    year,
    total: at(geo, year),
    men: at(geo, year, 'M') ?? null,
    women: at(geo, year, 'F') ?? null,
    /** Jaren waarin Eurostat een reeksbreuk vlagt. */
    breaks: years.filter((time) => flagAt(geo, time) === 'b'),
    series,
  };
}

const areas = data.categories('geo');
const countries = areas.filter((g) => !AGGREGATES.has(g)).map(entry).filter(Boolean);
const aggregates = areas.filter((g) => AGGREGATES.has(g)).map(entry).filter(Boolean);

const latestYear = countries.reduce((max, c) => (c.year > max ? c.year : max), '0');
const current = countries.filter((c) => c.year === latestYear);
const stale = countries.filter((c) => c.year !== latestYear);

/**
 * Het eerste jaar waarvanaf elk land met nu te vergelijken is: één jaar ná de
 * laatste breuk die er ergens in de huidige landen zit. Het breukjaar zelf valt
 * er bewust buiten, omdat de waarde daarin de overgang nog in zich heeft.
 */
const lastBreak = [...new Set(current.flatMap((c) => c.breaks))].sort().pop() ?? null;
const comparableSince = lastBreak ? (years[years.indexOf(lastBreak) + 1] ?? null) : years[0];

countries.sort((a, b) => a.total - b.total);

const index = {
  source: {
    publisher: 'Eurostat',
    dataset: CODE,
    label: data.label,
    /** Eurostats eigen definitie. Let op: die zegt iets anders dan het label. */
    definition: json.extension?.description ?? null,
    doi: '10.2908/YTH_DEMO_030',
    metadata: 'https://ec.europa.eu/eurostat/cache/metadata/en/lfst_hh_esms.htm',
    url: datasetUrl(CODE, { unit: 'AVG' }),
    eurostatUpdated: data.updated,
    fetchedOn: log.fetchedOn,
  },
  latestYear,
  years,
  countriesAtLatestYear: current.length,
  lastBreak,
  comparableSince,
  aggregates,
  countries,
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL('index.json', OUT_DIR), JSON.stringify(index) + '\n');

const sortedCurrent = [...current].sort((a, b) => a.total - b.total);
console.log(`Eurostat ${CODE} — "${data.label}"`);
console.log(`  definitie: ${(index.source.definition ?? '').replace(/<[^>]+>/g, '')}`);
console.log(`  bijgewerkt: ${data.updated}`);
console.log(`  ${countries.length} landen, ${aggregates.length} aggregaten`);
console.log(`  ${current.length} landen op ${latestYear}`);
if (stale.length) console.log(`  ouder: ${stale.map((c) => `${c.code} (${c.year})`).join(', ')}`);
console.log(`  laatste reeksbreuk: ${lastBreak} -> vergelijkbaar vanaf ${comparableSince}`);
const eu = aggregates.find((a) => a.code === 'EU27_2020');
if (eu) console.log(`  EU27 ${eu.year}: ${eu.total} (M ${eu.men} / F ${eu.women})`);
console.log(`  bereik ${latestYear}: ${sortedCurrent[0].code} ${sortedCurrent[0].total} … ${
  sortedCurrent[sortedCurrent.length - 1].code} ${sortedCurrent[sortedCurrent.length - 1].total}`);
console.log('  -> data/leaving-home/index.json');
