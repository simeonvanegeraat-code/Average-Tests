/**
 * Haalt de Eurostat-datasets op naar data/raw/eurostat/.
 *
 *   node scripts/fetch-eurostat.mjs
 *
 * Zoals bij de ECB (zie fetch-dwa.mjs) staat hier geen checksum op een vast
 * bestand: Eurostat publiceert bij, dus een veranderend antwoord is correct
 * gedrag en geen fout. Wat we in plaats daarvan vastleggen is de opvraagdatum,
 * Eurostats eigen updatestempel en de gevonden dimensies, zodat altijd na te
 * gaan is welke stand er op de site staat.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fetchDataset, reader, RAW_DIR } from './lib/eurostat.mjs';

/** Eén regel per dataset. De code is opgezocht in de catalogus, niet onthouden. */
const DATASETS = [
  {
    code: 'yth_demo_030',
    params: { unit: 'AVG' },
    expect: 'Estimated average age of young persons leaving the parental household',
  },
];

await mkdir(RAW_DIR, { recursive: true });

const log = [];

for (const dataset of DATASETS) {
  console.log(`Eurostat ${dataset.code}`);

  const { url, json } = await fetchDataset(dataset.code, dataset.params);
  const data = reader(json);

  console.log(`  ${url}`);
  console.log(`  "${data.label}"`);

  // Een stille codewissel is het gevaarlijkste scenario: je krijgt HTTP 200 met
  // een andere dataset. Daarom controleren we het label en niet alleen de status.
  if (dataset.expect && !data.label?.startsWith(dataset.expect.slice(0, 40))) {
    throw new Error(
      `${dataset.code} levert een ander label dan verwacht.\n` +
      `  verwacht: ${dataset.expect}\n` +
      `  gekregen: ${data.label}\n` +
      'Controleer in de catalogus of deze code van betekenis is veranderd.',
    );
  }

  const geo = data.categories('geo');
  const time = data.categories('time');

  console.log(`  bijgewerkt door Eurostat: ${data.updated}`);
  console.log(`  ${geo.length} gebieden, ${time.length} jaren (${time[0]}–${time[time.length - 1]})`);

  await writeFile(new URL(`${dataset.code}.json`, RAW_DIR), JSON.stringify(json));

  log.push({
    code: dataset.code,
    url,
    label: data.label,
    eurostatUpdated: data.updated,
    dimensions: Object.fromEntries(data.dimensions.map((d) => [d, data.categories(d).length])),
    years: [time[0], time[time.length - 1]],
    areas: geo,
  });
}

await writeFile(
  new URL('fetch-log.json', RAW_DIR),
  JSON.stringify({ fetchedOn: new Date().toISOString(), datasets: log }, null, 2) + '\n',
);

console.log(`\nKlaar. ${log.length} dataset(s) in data/raw/eurostat/.`);
