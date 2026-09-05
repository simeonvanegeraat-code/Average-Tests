/**
 * Haalt de ECB Distributional Wealth Accounts op naar data/raw/dwa/.
 *
 *   node scripts/fetch-dwa.mjs
 *
 * Anders dan bij NHANES kunnen we hier geen checksum op een vast bestand zetten:
 * de ECB publiceert elk kwartaal bij, dus het antwoord hoort te veranderen. Wat we
 * in plaats daarvan vastleggen is de opvraagdatum en de gevonden periodes, zodat
 * altijd na te gaan is welke stand er op de site staat.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { API, SERIES_KEY, START_PERIOD, RAW_DIR, parseCsvLine } from './lib/dwa.mjs';

const url = `${API}/${SERIES_KEY}?startPeriod=${START_PERIOD}&format=csvdata`;

console.log('ECB Distributional Wealth Accounts');
console.log(`  ${url}`);

const res = await fetch(url, { headers: { 'User-Agent': 'humanaverage/1.0 (data pipeline)' } });
if (!res.ok) {
  throw new Error(
    `ECB API gaf HTTP ${res.status}.\n` +
    'Controleer de reekssleutel in scripts/lib/dwa.mjs. Een 400 betekent meestal dat ' +
    'het aantal dimensiesegmenten niet klopt: DWA heeft er tien, dus negen punten.',
  );
}

const csv = await res.text();
const lines = csv.split('\n').filter(Boolean);
if (lines.length < 2) throw new Error('Leeg antwoord van de ECB-API.');

const header = parseCsvLine(lines[0]);
const col = (name) => header.indexOf(name);
const rows = lines.slice(1).map(parseCsvLine);

const periods = [...new Set(rows.map((r) => r[col('TIME_PERIOD')]))].sort();
const areas = [...new Set(rows.map((r) => r[col('REF_AREA')]))].sort();

// Zonder netto vermogen is de hele dataset waardeloos voor ons; dat controleren we
// hier al, zodat een stille sleutelfout niet pas op de site zichtbaar wordt.
const netWealth = rows.filter((r) => r[col('INSTR_ASSET')] === 'NWA').length;
if (netWealth === 0) {
  throw new Error(
    'Geen enkele NWA-reeks opgehaald. Netto vermogen staat onder ACCOUNT_ENTRY "N", ' +
    'niet "A" — controleer SERIES_KEY.',
  );
}

await mkdir(RAW_DIR, { recursive: true });
await writeFile(new URL('dwa.csv', RAW_DIR), csv);
await writeFile(
  new URL('fetch-log.json', RAW_DIR),
  JSON.stringify({
    fetchedOn: new Date().toISOString(),
    url,
    observations: rows.length,
    periods,
    areas,
    netWealthSeries: netWealth,
  }, null, 2) + '\n',
);

console.log(`  ${rows.length.toLocaleString('en-US')} waarnemingen`);
console.log(`  ${areas.length} gebieden, ${periods.length} kwartalen (${periods[0]} t/m ${periods.at(-1)})`);
console.log(`  ${netWealth.toLocaleString('en-US')} reeksen netto vermogen`);
console.log('\nVolgende stap: node scripts/build-wealth.mjs');
