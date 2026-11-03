/**
 * Haalt de woorden uit de metriekbeschrijvingen en zet ze in een woordenbestand.
 *
 *   node scripts/build-locale-metrics.mjs            schrijft src/locales/en/metrics.json
 *   node scripts/build-locale-metrics.mjs --check    vergelijkt zonder te schrijven
 *
 * `src/lib/metrics/*.js` houdt wat per metriek verschilt: de eenheid, de zes
 * klassegrenzen, de lenzen, en de woorden waarmee de kaart en het paneel erover praten.
 * Die woorden zijn het enige dat per taal verandert; de grenzen, de kleur en het aantal
 * decimalen niet. Dit script scheidt die twee, zodat het Engels in het woordenbestand
 * komt te staan zonder dat iemand het overtypt — en een overgetypt bestand is precies
 * hoe de landnamen bijna fout gingen.
 *
 * **Alleen het Engels wordt gegenereerd.** Een tweede taal is een vertaling en geen
 * afleiding: er bestaat geen bron waaruit "Smallest" als "Kleinste" volgt. Daarin is dit
 * script anders dan `build-locale-names.mjs`, dat de Nederlandse landnamen wél uit CLDR
 * kan halen.
 *
 * WAT HIER NIET GEBEURT, EN WAAROM
 *
 * De zestig klasselabels blijven tekst in plaats van een vorm die uit de grenzen
 * gerekend wordt. Dat is tegen het instinct — "under 22" bevat de 22 die er als `until`
 * al staat — maar de opmaak van dat getal is per metriek met de hand gekozen en volgt
 * geen regel:
 *
 *   household-size   2.0 to 2.2    houdt zijn nul
 *   pension-age      60 to 61 … 63 to 64.5    heeft die nul niet
 *
 * Een generator die beide reproduceert bestaat niet, en een die één van de twee
 * verandert verandert de Engelse site. Daarom blijven ze gegevens, en controleert
 * `validate-i18n.mjs` in plaats daarvan dat de getallen in een label de grenzen zijn
 * die het label beschrijft. De dubbeling blijft, maar hij kan niet meer wegdrijven.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/lib/metrics';
const OUT = 'src/locales/en/metrics.json';
const check = process.argv.includes('--check');

/** Welke sleutels van een metriek woorden zijn. De rest is getal, kleur of pad. */
const WORDS = ['label', 'unit', 'unitOne', 'unitShort'];
const INPUT_WORDS = ['label', 'placeholder', 'noun'];
const LENS_WORDS = ['label', 'who'];

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.js'))
  .sort();

const out = {};
let fragmenten = 0;

for (const file of files) {
  const cfg = (await import(`../${DIR}/${file}`)).default;
  const entry = {};

  for (const key of WORDS) {
    if (cfg[key] !== undefined) {
      entry[key] = cfg[key];
      fragmenten++;
    }
  }

  entry.bands = cfg.bands.map((band) => band.label);
  fragmenten += entry.bands.length;

  /**
   * Lenzen op hun eigen sleutel en niet op hun plek in de lijst. Een lens heeft een
   * `key` ('total', 'men', 'women') en die is stabiel; de volgorde is dat niet.
   */
  entry.lenses = {};
  for (const lens of cfg.lenses) {
    const words = {};
    for (const key of LENS_WORDS) {
      if (lens[key] !== undefined) {
        words[key] = lens[key];
        fragmenten++;
      }
    }
    entry.lenses[lens.key] = words;
  }

  entry.words = { ...cfg.words };
  fragmenten += Object.keys(entry.words).length;

  if (cfg.input) {
    entry.input = {};
    for (const key of INPUT_WORDS) {
      if (cfg.input[key] !== undefined) {
        entry.input[key] = cfg.input[key];
        fragmenten++;
      }
    }
  }

  out[cfg.key] = entry;
}

const json = `${JSON.stringify(out, null, 2)}\n`;

console.log(`${files.length} metriek(en), ${fragmenten} fragment(en)`);

if (check) {
  if (!existsSync(OUT)) {
    console.error(`\n${OUT} bestaat niet. Draai dit script zonder --check.`);
    process.exit(1);
  }
  const op = readFileSync(OUT, 'utf8');
  if (op === json) {
    console.log(`  ${OUT} is bij`);
    process.exit(0);
  }
  console.error(`\n${OUT} wijkt af van de metriekbeschrijvingen.`);
  console.error('Iemand heeft een woord in src/lib/metrics/ veranderd zonder dit script te draaien,');
  console.error('of het Engels in het woordenbestand met de hand aangepast. Draai:');
  console.error('  node scripts/build-locale-metrics.mjs');
  process.exit(1);
}

mkdirSync('src/locales/en', { recursive: true });
writeFileSync(OUT, json, 'utf8');
console.log(`  ${OUT} geschreven`);
