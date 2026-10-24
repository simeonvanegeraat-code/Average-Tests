/**
 * Bouwt data/wealth/*.json uit de opgehaalde DWA-data.
 *
 *   node scripts/fetch-dwa.mjs
 *   node scripts/build-wealth.mjs
 *
 * Eén bestand per land plus een index. De site rekent zelf niets meer uit behalve
 * het plaatsen van de bezoeker tussen twee groepsgemiddelden.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import {
  RAW_DIR, OUT_DIR, COUNTRIES, AGGREGATES, INSTRUMENTS,
  WEALTH_GROUPS, STATUS_GROUPS, UNITS, PER_HOUSEHOLD_SCALE, parseCsvLine,
} from './lib/dwa.mjs';

const csv = await readFile(new URL('dwa.csv', RAW_DIR), 'utf8');
const lines = csv.split('\n').filter(Boolean);
const header = parseCsvLine(lines[0]);
const col = Object.fromEntries(header.map((h, i) => [h, i]));
const rows = lines.slice(1).map(parseCsvLine);

/** Alle waarnemingen van één reeks, oplopend op kwartaal. */
function series({ area, instrument, group, unit }) {
  return rows
    .filter((r) =>
      r[col.REF_AREA] === area &&
      r[col.INSTR_ASSET] === instrument &&
      r[col.DWA_GRP] === group &&
      r[col.UNIT_MEASURE] === unit)
    .map((r) => ({ period: r[col.TIME_PERIOD], value: Number(r[col.OBS_VALUE]) }))
    .filter((o) => Number.isFinite(o.value))
    .sort((a, b) => (a.period < b.period ? -1 : 1));
}

const latest = (list) => (list.length ? list[list.length - 1] : null);

/** Bedragen per huishouden staan in duizenden; alles wat we opslaan is in euro's. */
const toEuro = (value) => Math.round(value * PER_HOUSEHOLD_SCALE);

function perHousehold(area, group, instrument = 'NWA') {
  const point = latest(series({ area, instrument, group, unit: UNITS.PER_HOUSEHOLD }));
  return point ? { value: toEuro(point.value), period: point.period } : null;
}

function buildArea(area) {
  const medianSeries = series({ area, instrument: 'NWA', group: '_Z', unit: UNITS.MEDIAN });
  const meanSeries = series({ area, instrument: 'NWA', group: '_Z', unit: UNITS.MEAN });
  const median = latest(medianSeries);
  const mean = latest(meanSeries);
  if (!median) return null;                       // zonder mediaan bouwen we geen pagina

  // Beweging over het laatste jaar: vier kwartalen terug, als die er is.
  const yearAgo = medianSeries.length > 4 ? medianSeries[medianSeries.length - 5] : null;

  const groups = WEALTH_GROUPS
    .map((g) => {
      const point = perHousehold(area, g.code);
      return point ? { ...g, netWealth: point.value } : null;
    })
    .filter(Boolean);

  const status = STATUS_GROUPS
    .map((g) => {
      const point = perHousehold(area, g.code);
      return point ? { ...g, netWealth: point.value } : null;
    })
    .filter(Boolean);

  // De balans per vermogensgroep: waar zit het vermogen in, en wat staat ertegenover.
  // Let op: schulden komen als negatieve bedragen binnen, dus de som van alle posten
  // hieronder hoort exact het netto vermogen te zijn.
  const composition = {};
  for (const g of ['B50', 'Q3', 'D10']) {
    const parts = Object.entries(INSTRUMENTS)
      .map(([code, meta]) => {
        const point = perHousehold(area, g, code);
        return point ? { code, ...meta, value: point.value } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
    if (parts.length) composition[g] = parts;
  }

  return {
    area,
    name: COUNTRIES[area] ?? area,
    isAggregate: AGGREGATES.includes(area),
    period: median.period,
    median: Math.round(median.value),
    mean: mean ? Math.round(mean.value) : null,
    medianYearAgo: yearAgo ? { period: yearAgo.period, value: Math.round(yearAgo.value) } : null,
    medianHistory: medianSeries.map((p) => ({ period: p.period, value: Math.round(p.value) })),
    groups,
    status,
    composition,
  };
}

const areaCodes = [...Object.keys(COUNTRIES), ...AGGREGATES];
const built = areaCodes.map(buildArea).filter(Boolean);

await mkdir(OUT_DIR, { recursive: true });

for (const area of built) {
  await writeFile(new URL(`${area.area.toLowerCase()}.json`, OUT_DIR), JSON.stringify(area) + '\n');
}

const index = {
  source: 'ECB Distributional Wealth Accounts',
  generated: new Date().toISOString().slice(0, 10),
  latestPeriod: built.map((a) => a.period).sort().at(-1),
  countries: built
    .filter((a) => !a.isAggregate)
    .map((a) => ({
      area: a.area,
      name: a.name,
      period: a.period,
      median: a.median,
      mean: a.mean,
      homeowners: a.status.find((s) => s.code === 'HSO')?.netWealth ?? null,
      renters: a.status.find((s) => s.code === 'HST')?.netWealth ?? null,
      // De kwintielladder moet mee: het instrument plaatst een bezoeker hiertussen,
      // en zonder deze velden heeft de index niet genoeg om dat te doen.
      groups: a.groups.filter((g) => g.kind === 'quintile'),
    }))
    .sort((a, b) => b.median - a.median),
  euroArea: built.find((a) => a.area === 'I9') ?? null,
};

await writeFile(new URL('index.json', OUT_DIR), JSON.stringify(index) + '\n');

const missing = areaCodes.filter((c) => !built.some((b) => b.area === c));
console.log(`${built.length} gebieden -> data/wealth/`);
console.log(`  laatste kwartaal: ${index.latestPeriod}`);
console.log(`  landen met een mediaan: ${index.countries.length}`);
if (missing.length) console.log(`  geen data voor: ${missing.join(' ')}`);
