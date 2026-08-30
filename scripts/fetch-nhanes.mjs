/**
 * Haalt de NHANES-microdata op naar data/raw/nhanes/ en controleert elke download
 * tegen de SHA-256 in lib/nhanes.mjs.
 *
 * De ruwe bestanden staan bewust niet in git (zie .gitignore): ze zijn groot en
 * binair. Reproduceerbaarheid komt van de vastgelegde URL's plus checksums — wijzigt
 * CDC een bestand, dan faalt dit script in plaats van stilletjes andere cijfers te
 * produceren.
 *
 *   node scripts/fetch-nhanes.mjs
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { BASE_URL, CYCLES, RAW_DIR } from './lib/nhanes.mjs';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

async function ensure(file) {
  const target = new URL(file.name, RAW_DIR);

  try {
    const existing = await readFile(target);
    if (sha256(existing) === file.sha256) {
      console.log(`  ${file.name.padEnd(12)} al aanwezig, checksum klopt`);
      return;
    }
    console.log(`  ${file.name.padEnd(12)} aanwezig maar checksum wijkt af, opnieuw ophalen`);
  } catch {
    // nog niet gedownload
  }

  const url = `${BASE_URL}/${file.path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file.name}: HTTP ${res.status} bij ${url}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const digest = sha256(buf);

  if (digest !== file.sha256) {
    throw new Error(
      `${file.name}: checksum komt niet overeen.\n` +
      `  verwacht: ${file.sha256}\n` +
      `  gekregen: ${digest}\n` +
      `De bron is veranderd. Controleer wat CDC heeft aangepast en werk lib/nhanes.mjs\n` +
      `en data/sources.md bij voordat je opnieuw bouwt. Publiceer geen cijfers uit\n` +
      `een bestand dat niet is wat we dachten.`
    );
  }
  if (buf.length !== file.bytes) {
    throw new Error(`${file.name}: ${buf.length} bytes, verwacht ${file.bytes}`);
  }

  await writeFile(target, buf);
  console.log(`  ${file.name.padEnd(12)} opgehaald, ${buf.length} bytes, checksum klopt`);
}

await mkdir(RAW_DIR, { recursive: true });

for (const cycle of CYCLES) {
  console.log(`NHANES ${cycle.id} — ${cycle.label}`);
  for (const file of Object.values(cycle.files)) await ensure(file);
}

console.log('\nKlaar. Volgende stap: node scripts/build-percentiles.mjs');
