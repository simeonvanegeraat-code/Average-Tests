/**
 * Haalt de HFCS-tabellen van de ECB op naar data/raw/hfcs/.
 *
 *   node scripts/fetch-hfcs.mjs
 *
 * De bestandsnaam draagt de publicatiedatum ("..._Wave_2023_October_2026.zip"), dus die
 * vastleggen zou betekenen dat de opvraag stilletjes bij een oude versie blijft hangen
 * zodra de ECB bijwerkt. In plaats daarvan wordt de link op de indexpagina gezocht en
 * de hoogste golf genomen.
 *
 * Wat hier wél wordt vastgelegd is de SHA-256 van wat we binnenkregen. Anders dan bij
 * DWA hoort dit bestand nauwelijks te veranderen — een golf verschijnt eens per drie
 * jaar — dus een gewijzigde hash is nieuws en geen ruis. De poort vergelijkt hem.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { INDEX_URL, ORIGIN, RAW_DIR, findLatestWaveZip } from './lib/hfcs.mjs';
import { zipEntries } from './lib/xlsx.mjs';

const UA = { 'User-Agent': 'humanaverage/1.0 (data pipeline)' };

console.log('ECB Household Finance and Consumption Survey — statistische tabellen');
console.log(`  index: ${INDEX_URL}`);

const indexRes = await fetch(INDEX_URL, { headers: UA });
if (!indexRes.ok) throw new Error(`Indexpagina gaf HTTP ${indexRes.status}.`);

const { pad, wave, alle } = findLatestWaveZip(await indexRes.text());
const url = pad.startsWith('http') ? pad : `${ORIGIN}${pad}`;
console.log(`  golven gevonden: ${alle.map((g) => g.golf).join(', ')}`);
console.log(`  nieuwste: ${wave}`);
console.log(`  ${url}`);

const res = await fetch(url, { headers: UA });
if (!res.ok) throw new Error(`Download gaf HTTP ${res.status} voor ${url}.`);

const buf = Buffer.from(await res.arrayBuffer());
const sha256 = createHash('sha256').update(buf).digest('hex');
console.log(`  ${(buf.length / 1024 / 1024).toFixed(1)} MB · sha256 ${sha256.slice(0, 16)}…`);

/**
 * Meteen openmaken, niet pas in de bouwstap. Een HTML-foutpagina met status 200 is
 * geen zip, en dat hoort hier om te vallen en niet drie stappen verderop.
 */
const inhoud = zipEntries(buf);
const xlsxNamen = [...inhoud.keys()].filter((n) => n.toLowerCase().endsWith('.xlsx'));
if (xlsxNamen.length !== 1) {
  throw new Error(
    `Verwacht precies één xlsx in de zip, gevonden ${xlsxNamen.length}: ${[...inhoud.keys()].join(', ')}`,
  );
}

await mkdir(RAW_DIR, { recursive: true });
await writeFile(new URL('tables.zip', RAW_DIR), buf);
await writeFile(
  new URL('fetch-log.json', RAW_DIR),
  JSON.stringify(
    {
      fetchedOn: new Date().toISOString(),
      indexUrl: INDEX_URL,
      url,
      wave,
      wavesOnPage: alle.map((g) => g.golf),
      bytes: buf.length,
      sha256,
      xlsx: xlsxNamen[0],
    },
    null,
    2,
  ) + '\n',
);

console.log(`  bevat: ${xlsxNamen[0]}`);
console.log(`\nOpgeslagen in ${RAW_DIR.pathname.replace(/^\//, '')}`);
