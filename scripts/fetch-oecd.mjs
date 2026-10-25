/**
 * Haalt de feitelijke uittreedleeftijd op bij de OECD en bewaart het ruwe antwoord.
 *
 * Eén maat: ELMEA, "Effective labour market exit age". De OECD publiceert die alleen
 * per geslacht — er is geen totaal, en zelf middelen zou een verzonnen statistiek
 * zijn. De pagina toont mannen en vrouwen daarom apart.
 *
 * Het ruwe antwoord gaat ongewijzigd naar data/raw/oecd/, zodat de poort erop kan
 * terugrekenen in plaats van het gebouwde bestand te geloven.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dataUrl, fetchJson, readObservations } from './lib/oecd.mjs';
import { PENSION } from './oecd.mjs';

const RAW = new URL('../data/raw/oecd/', import.meta.url);

async function main() {
  await mkdir(RAW, { recursive: true });

  const url = dataUrl({ dataflow: PENSION.dataflow, key: PENSION.key_ });
  const json = await fetchJson(url);
  const { rows, times } = readObservations(json);

  await writeFile(new URL(`${PENSION.key}.json`, RAW), JSON.stringify({ url, fetchedOn: new Date().toISOString(), json }) + '\n');

  const landen = new Set(rows.map((row) => row.REF_AREA));
  const seksen = [...new Set(rows.map((row) => row.SEX))].sort();
  console.log(
    `${PENSION.key.padEnd(10)} ${PENSION.measure.padEnd(8)} ${rows.length} waarnemingen, ` +
      `${landen.size} gebieden, ${times[0]}–${times[times.length - 1]}, geslacht ${seksen.join('/')}`,
  );
}

await main();
