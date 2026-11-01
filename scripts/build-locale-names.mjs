/**
 * Bouwt `src/locales/<taal>/countries.json` voor het Engels, uit de datasets die al
 * in de repo staan.
 *
 * Waarom gegenereerd en niet getypt. De naam van een land staat nu in de data: elk
 * record in `data/*​/index.json` heeft `"name": "Finland"`, en `.name` wordt 250 keer
 * gelezen in 34 bestanden. Een tweede taal kan die 250 plekken niet verbouwen, dus
 * komen de namen uit een woordenbestand en vult `localise()` ze in op de grens.
 *
 * Het Engelse woordenbestand is daarmee een kopie van wat al in de data staat, en een
 * kopie die je met de hand maakt, wijkt af. Niet vandaag — over een half jaar, als een
 * bron een naam herziet en de data meegaat en het woordenbestand niet. Dan zegt een
 * pagina iets anders dan de tabel ernaast, en dat is precies het soort fout dat
 * niemand ziet. Daarom genereert dit script het bestand, en controleert
 * `validate-i18n.mjs` daarna of het nog klopt.
 *
 * Dit script raakt alleen het Engels aan. De Nederlandse en Duitse bestanden worden
 * geschreven, niet afgeleid: die hebben een eigen bron (de Interinstitutionele
 * schrijfwijzer van de EU, bijlage A5) en die hoort in data/sources.md.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DATA = 'data';
const OUT = 'src/locales/en/countries.json';

/**
 * Eurostat noemt het veld `code`, de ECB `area`. Beide zijn de sleutel van de rij;
 * welke van de twee het is, hangt van de uitgever af en niet van de inhoud.
 */
const codeOf = (row) => row.code ?? row.area ?? null;

const names = new Map();
const sources = new Map();
let rows = 0;

for (const entry of readdirSync(DATA, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  let index;
  try {
    index = JSON.parse(readFileSync(`${DATA}/${entry.name}/index.json`, 'utf8'));
  } catch {
    continue; // Niet elke map onder data/ is een dataset met een index.
  }

  for (const group of ['countries', 'aggregates']) {
    for (const row of index[group] ?? []) {
      const code = codeOf(row);
      if (!code || typeof row.name !== 'string') continue;
      rows++;

      const known = names.get(code);
      if (known !== undefined && known !== row.name) {
        console.error(`\n  ${code} heeft twee namen:`);
        console.error(`    "${known}"  ← ${sources.get(code)}`);
        console.error(`    "${row.name}"  ← ${entry.name}.${group}`);
        console.error('\n  Eén woordenbestand kan die niet beide dragen. Los dit in de data op.');
        process.exit(1);
      }
      names.set(code, row.name);
      if (!known) sources.set(code, `${entry.name}.${group}`);
    }
  }
}

if (names.size === 0) {
  console.error('Geen enkele naam gevonden onder data/. Draait dit uit de wortel van de repo?');
  process.exit(1);
}

const sorted = Object.fromEntries([...names].sort(([a], [b]) => a.localeCompare(b, 'en')));
writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');

console.log(`  ${OUT}`);
console.log(`  ${names.size} namen uit ${rows} rijen`);
