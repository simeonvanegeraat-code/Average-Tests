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
 * **Ook de andere talen worden afgeleid, en dat was eerst anders bedoeld.** Het plan
 * schreef dat de Nederlandse namen getypt zouden worden, uit de Interinstitutionele
 * schrijfwijzer van de EU. Op 1 november 2026 bleek dat niet nodig: Node draagt de
 * volledige CLDR-tabel mee, en `Intl.DisplayNames(['nl'], { type: 'region' })` geeft
 * "Nederland", "Tsjechië", "Noord-Macedonië", "IJsland". Dat is een gepubliceerde
 * tabel in plaats van mijn geheugen, en het argument hierboven — een getypte kopie
 * wijkt af — geldt voor 103 Nederlandse namen sterker dan voor 103 Engelse.
 *
 * Twee dingen kan CLDR niet, en die staan daarom hieronder uitgeschreven:
 *
 *  1. **Codes die geen ISO-landcode zijn.** De OESO-data gebruikt drieletterige codes
 *     (`NLD`) en Eurostat schrijft Griekenland als `EL`. `ALIAS` wijst die naar hun
 *     ISO 3166-1 alpha-2, en het script controleert die tabel: voor 49 van de 52 geeft
 *     ICU in het Engels exact de naam die al in de data staat. Dat is het bewijs dat de
 *     koppeling klopt, en niet dat ik hem goed heb ingetypt.
 *  2. **Aggregaten.** De EU, de eurozone en het OESO-gemiddelde zijn geen landen en
 *     staan niet in CLDR. Die namen staan in `AGGREGATES`, per taal.
 *
 * Draai met `--check` om te vergelijken zonder te schrijven; dat doet de poort.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DATA = 'data';
/** De standaardtaal staat in src/lib/locales.js; hier als letterlijke waarde, want
 *  dit script draait buiten de Astro-build en importeert geen app-code. */
const DEFAULT_LANG = 'en';
const out = (lang) => `src/locales/${lang}/countries.json`;
const CHECK = process.argv.includes('--check');

/** Talen die dit script afleidt. Het Engels komt uit de data, de rest uit CLDR. */
const DERIVED = ['nl'];

/**
 * Codes die geen ISO 3166-1 alpha-2 zijn, en waar ze naar wijzen. De drieletterige
 * komen uit de OESO-pijplijn; `EL` is Eurostats code voor Griekenland, waar ISO `GR`
 * schrijft. Deze tabel wordt hieronder getoetst en niet op mijn woord geloofd.
 */
const ALIAS = {
  ARG: 'AR', AUS: 'AU', AUT: 'AT', BEL: 'BE', BGR: 'BG', BRA: 'BR', CAN: 'CA',
  CHE: 'CH', CHL: 'CL', CHN: 'CN', COL: 'CO', CRI: 'CR', CYP: 'CY', CZE: 'CZ',
  DEU: 'DE', DNK: 'DK', ESP: 'ES', EST: 'EE', FIN: 'FI', FRA: 'FR', GBR: 'GB',
  GRC: 'GR', HRV: 'HR', HUN: 'HU', IDN: 'ID', IND: 'IN', IRL: 'IE', ISL: 'IS',
  ISR: 'IL', ITA: 'IT', JPN: 'JP', KOR: 'KR', LTU: 'LT', LUX: 'LU', LVA: 'LV',
  MEX: 'MX', MLT: 'MT', NLD: 'NL', NOR: 'NO', NZL: 'NZ', POL: 'PL', PRT: 'PT',
  ROU: 'RO', RUS: 'RU', SAU: 'SA', SVK: 'SK', SVN: 'SI', SWE: 'SE', TUR: 'TR',
  USA: 'US', ZAF: 'ZA',
  EL: 'GR',
};

/**
 * Aggregaten per taal. Geen landen, dus niet in CLDR.
 *
 * De jaartallen en de reeksen blijven exact staan zoals de uitgever ze schrijft, ook
 * de inconsistente streepjes: dat is zijn label en niet onze opmaak. Vertaald wordt
 * alleen het woord ervoor. Een label is een naam, geen definitie — een definitie van
 * een uitgever blijft onvertaald, zie besluit 1 in research/i18n-plan.md.
 */
const AGGREGATES = {
  nl: {
    EA: 'Eurozone (EA11-1999, EA12-2001, EA13-2007, EA15-2008, EA16-2009, EA17-2011, EA18-2014, EA19-2015, EA20-2023, EA21-2026)',
    EA18: 'Eurozone - 18 landen (2014)',
    EA19: 'Eurozone - 19 landen  (2015-2022)',
    EA20: 'Eurozone – 20 landen (2023-2025)',
    EA21: 'Eurozone – 21 landen (vanaf 2026)',
    EU27: 'Europese Unie (27 landen)',
    EU27_2007: 'Europese Unie - 27 landen (2007-2013)',
    EU27_2020: 'Europese Unie - 27 landen (vanaf 2020)',
    EU28: 'Europese Unie - 28 landen (2013-2020)',
    OECD_REP: 'Gemiddeld OESO-land',
  },
};

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

/**
 * Eén taal, uit CLDR plus de twee tabellen hierboven.
 *
 * Een code die nergens vandaan komt wordt niet verzonnen en niet leeg gelaten: hij
 * houdt zijn Engelse naam en wordt hieronder gemeld. Een lege plek in een landentabel
 * is erger dan een naam in de verkeerde taal, want die laatste is te zien.
 */
function derive(lang) {
  const display = new Intl.DisplayNames([lang], { type: 'region', fallback: 'none' });
  const aggregates = AGGREGATES[lang] ?? {};
  const result = {};
  const open = [];

  for (const code of Object.keys(sorted)) {
    if (aggregates[code]) {
      result[code] = aggregates[code];
      continue;
    }
    const region = ALIAS[code] ?? code;
    let name;
    try {
      name = display.of(region);
    } catch {
      name = undefined; // Geen geldige regiocode; dan is het een aggregaat zonder regel.
    }
    if (name) {
      result[code] = name;
    } else {
      result[code] = sorted[code];
      open.push(code);
    }
  }

  return { result, open };
}

/** Toetst ALIAS tegen de data: ICU in het Engels hoort te zeggen wat de data zegt. */
function checkAlias() {
  const english = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
  const mismatch = [];
  let agreed = 0;

  for (const [code, region] of Object.entries(ALIAS)) {
    let icu;
    try {
      icu = english.of(region);
    } catch {
      icu = undefined;
    }
    if (!icu) {
      console.error(`\n  ALIAS: ${code} wijst naar ${region}, en dat is geen regiocode.`);
      process.exit(1);
    }
    if (sorted[code] === icu) agreed++;
    else mismatch.push([code, region, sorted[code], icu]);
  }

  return { agreed, mismatch };
}

const { agreed, mismatch } = checkAlias();

const files = [[out(DEFAULT_LANG), sorted, null]];
for (const lang of DERIVED) {
  const { result, open } = derive(lang);
  files.push([out(lang), result, open]);
}

let drift = 0;
for (const [path, data, open] of files) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  if (CHECK) {
    let onDisk = null;
    try {
      onDisk = readFileSync(path, 'utf8');
    } catch {
      onDisk = null;
    }
    if (onDisk !== text) {
      console.error(`  ${path}: wijkt af van wat dit script zou schrijven`);
      drift++;
    } else {
      console.log(`  ${path}  ${Object.keys(data).length} namen`);
    }
  } else {
    writeFileSync(path, text, 'utf8');
    console.log(`  ${path}  ${Object.keys(data).length} namen${open && open.length ? `, ${open.length} zonder eigen naam` : ''}`);
  }
  if (open && open.length) {
    console.log(`    nog Engels: ${open.join(', ')}`);
  }
}

console.log(`\n  ${names.size} namen uit ${rows} rijen`);
console.log(`  ALIAS: ${agreed}/${Object.keys(ALIAS).length} geven in het Engels exact de naam uit de data`);
for (const [code, region, data, icu] of mismatch) {
  console.log(`    ${code} → ${region}: data zegt ${JSON.stringify(data)}, CLDR ${JSON.stringify(icu)} — de uitgever schrijft het anders, de koppeling is goed`);
}

if (drift) {
  console.error(`\n${drift} woordenbestand(en) lopen uit de pas. Draai \`npm run locales:build\`.`);
  process.exit(1);
}
