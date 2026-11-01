/**
 * Haalt elke metriek uit scripts/metrics.mjs op naar data/raw/eurostat/.
 *
 *   node scripts/fetch-metrics.mjs [key ...]
 *
 * Geen checksum op het antwoord: Eurostat publiceert bij, dus een veranderend
 * antwoord is correct gedrag. Wat we wél controleren is het label, want het
 * gevaarlijkste scenario is een stil hergebruikte code die netjes HTTP 200 geeft
 * met andere data erin.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fetchDataset, reader, RAW_DIR } from './lib/eurostat.mjs';
import { METRICS } from './metrics.mjs';

const wanted = process.argv.slice(2);
const todo = wanted.length ? METRICS.filter((m) => wanted.includes(m.key)) : METRICS;

if (todo.length === 0) {
  console.error(`Geen metriek gevonden voor: ${wanted.join(', ')}`);
  process.exit(1);
}

await mkdir(RAW_DIR, { recursive: true });
const log = [];

for (const spec of todo) {
  const { url, json } = await fetchDataset(spec.code, spec.params ?? {});
  const data = reader(json);

  if (spec.expect && !data.label?.toLowerCase().includes(spec.expect.toLowerCase().slice(0, 24))) {
    throw new Error(
      `${spec.code} levert een ander label dan verwacht.\n  verwacht: ${spec.expect}\n  gekregen: ${data.label}\n` +
        'Controleer in de catalogus of deze code van betekenis is veranderd.',
    );
  }

  const time = data.categories('time');
  console.log(`${spec.key.padEnd(16)} ${spec.code.padEnd(14)} ${data.categories('geo').length} gebieden, ${time[0]}–${time[time.length - 1]}`);

  // Op de spec-sleutel: drie specs delen `une_rt_m` en zouden elkaars bestand overschrijven.
  await writeFile(new URL(`${spec.key}.json`, RAW_DIR), JSON.stringify(json));
  log.push({
    key: spec.key,
    code: spec.code,
    url,
    label: data.label,
    eurostatUpdated: data.updated,
    years: [time[0], time[time.length - 1]],
    areas: data.categories('geo'),
  });
}

await writeFile(
  new URL('fetch-log.json', RAW_DIR),
  JSON.stringify({ fetchedOn: new Date().toISOString(), datasets: log }, null, 2) + '\n',
);
console.log(`\n${log.length} dataset(s) in data/raw/eurostat/.`);
