/**
 * Bouwt data/wealth-age/index.json uit de opgehaalde HFCS-tabellen.
 *
 *   node scripts/build-hfcs.mjs
 *
 * Leest drie tabbladen: A3 (medianen), A4 (gemiddelden) en "Reference periods" (het
 * veldwerk per land). Alle drie worden onafhankelijk doorzocht in plaats van op een
 * vaste rij aangesproken — de ECB schuift bij elke golf rijen, en een vaste rij geeft
 * dan geen fout maar het verkeerde cijfer.
 *
 * Twee dingen die hier bewust niet gebeuren:
 *
 *  - **Niets wordt opgehoogd naar vandaag.** De cijfers dragen de veldwerkperiode van
 *    hun eigen land, die van februari 2022 tot juli 2025 loopt. Eén jaartal boven alle
 *    landen zou onwaar zijn, en omrekenen naar nu is een schatting die deze stap niet
 *    maakt.
 *  - **Er wordt niets gemengd met DWA.** Dit bestand draagt zijn eigen totaalmediaan,
 *    zodat een pagina de leeftijdsgroepen tegen het juiste landcijfer kan zetten.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  AGE_BANDS, COUNTRIES, EURO_AREA, NOT_BUILT, OUT_DIR, RAW_DIR, SCALE, SHEETS, fieldworkPeriod,
} from './lib/hfcs.mjs';
import { openWorkbook, readSheet, sheetByPrefix } from './lib/xlsx.mjs';

const log = JSON.parse(await readFile(new URL('fetch-log.json', RAW_DIR), 'utf8'));
const zip = await readFile(new URL('tables.zip', RAW_DIR));
const { zipEntries } = await import('./lib/xlsx.mjs');
const xlsx = zipEntries(zip).get(log.xlsx);
if (!xlsx) throw new Error(`${log.xlsx} zit niet in de opgehaalde zip. Draai scripts/fetch-hfcs.mjs opnieuw.`);

const boek = await openWorkbook(xlsx);
const medianen = readSheet(boek, sheetByPrefix(boek, SHEETS.medians).pad);
const gemiddelden = readSheet(boek, sheetByPrefix(boek, SHEETS.means).pad);
const veldwerkBlad = readSheet(boek, sheetByPrefix(boek, SHEETS.fieldwork).pad);

/** De kopregel met landcodes, en welke kolom bij welke code hoort. */
function kolommen(rijen, naam) {
  const kop = rijen.find((r) => r.filter((c) => /^[A-Z]{2}$/.test(c)).length > 5);
  if (!kop) throw new Error(`${naam}: geen kopregel met landcodes gevonden.`);
  const uit = new Map();
  kop.forEach((cel, i) => {
    if (/^[A-Z]{2}$/.test(cel)) uit.set(cel, i);
    else if (EURO_AREA.header.test(cel)) uit.set(EURO_AREA.code, i);
  });
  return uit;
}

/** De rij waarop een uitsplitsing begint, en de rij per groep eronder. */
function blokRijen(rijen, naam) {
  const start = rijen.findIndex((r) => r[0] === 'Age of RP');
  if (start < 0) throw new Error(`${naam}: geen blok "Age of RP" gevonden.`);

  const perBand = new Map();
  for (let i = start; i < start + 2 * AGE_BANDS.length + 2 && i < rijen.length; i += 1) {
    const label = String(rijen[i][1] ?? '').trim();
    const band = AGE_BANDS.find((b) => b.code === label);
    if (band) perBand.set(band.code, i);
  }
  const ontbreekt = AGE_BANDS.filter((b) => !perBand.has(b.code));
  if (ontbreekt.length) {
    throw new Error(
      `${naam}: leeftijdsgroepen niet gevonden: ${ontbreekt.map((b) => b.code).join(', ')}.\n` +
      'De ECB heeft de indeling veranderd; pas AGE_BANDS in scripts/lib/hfcs.mjs aan voordat er iets gepubliceerd wordt.',
    );
  }

  const totaal = rijen.findIndex((r) => r[0] === 'Total population');
  if (totaal < 0) throw new Error(`${naam}: geen rij "Total population" gevonden.`);
  return { perBand, totaal };
}

const kolM = kolommen(medianen, SHEETS.medians);
const kolG = kolommen(gemiddelden, SHEETS.means);
const blokM = blokRijen(medianen, SHEETS.medians);
const blokG = blokRijen(gemiddelden, SHEETS.means);

/** Een bedrag uit het tabblad, in euro's. Leeg blijft null; onleesbaar valt om. */
function bedrag(rijen, rij, kol, waar) {
  const cel = String(rijen[rij]?.[kol] ?? '').trim();
  if (cel === '') return null;
  const n = Number(cel);
  if (!Number.isFinite(n)) throw new Error(`${waar}: "${cel}" is geen getal.`);
  return Math.round(n * SCALE);
}

/** De standaardfout staat één rij lager, tussen haakjes. */
function fout(rijen, rij, kol) {
  const cel = String(rijen[rij + 1]?.[kol] ?? '').trim();
  const m = /^\(([\d.]+)\)$/.exec(cel);
  return m ? Math.round(Number(m[1]) * SCALE) : null;
}

/** Het veldwerk per land, op naam gezocht — niet op volgorde, want die is niet beloofd. */
const veldwerk = new Map();
for (const rij of veldwerkBlad) {
  const naam = String(rij[0] ?? '').trim();
  const van = fieldworkPeriod(rij[1]);
  const tot = fieldworkPeriod(rij[2]);
  if (naam && van && tot) veldwerk.set(naam, { from: van, to: tot });
}

function bouw(code, naam) {
  const kM = kolM.get(code);
  const kG = kolG.get(code);
  if (kM === undefined || kG === undefined) return null;

  const bands = AGE_BANDS.map((band) => ({
    code: band.code,
    label: band.label,
    median: bedrag(medianen, blokM.perBand.get(band.code), kM, `${code}/${band.code}/mediaan`),
    mean: bedrag(gemiddelden, blokG.perBand.get(band.code), kG, `${code}/${band.code}/gemiddelde`),
    medianSe: fout(medianen, blokM.perBand.get(band.code), kM),
    meanSe: fout(gemiddelden, blokG.perBand.get(band.code), kG),
  }));

  const metWaarde = bands.filter((b) => b.median !== null);
  const piek = metWaarde.reduce((top, b) => (b.median > top.median ? b : top), metWaarde[0]);
  const jongste = bands[0];

  return {
    area: code,
    name: naam,
    fieldwork: veldwerk.get(naam) ?? null,
    total: {
      median: bedrag(medianen, blokM.totaal, kM, `${code}/totaal/mediaan`),
      mean: bedrag(gemiddelden, blokG.totaal, kG, `${code}/totaal/gemiddelde`),
    },
    bands,
    /** De groep met het hoogste middelpunt, en hoeveel keer de jongste groep dat is. */
    peak: piek?.code ?? null,
    climb: jongste?.median ? Number((piek.median / jongste.median).toFixed(1)) : null,
  };
}

const landen = Object.entries(COUNTRIES)
  .map(([code, naam]) => bouw(code, naam))
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

const zonderVeldwerk = landen.filter((l) => !l.fieldwork);
if (zonderVeldwerk.length) {
  throw new Error(
    `Geen veldwerkperiode voor: ${zonderVeldwerk.map((l) => `${l.area} (${l.name})`).join(', ')}.\n` +
    'Het tabblad "Reference periods" schrijft die landnaam anders dan COUNTRIES in scripts/lib/dwa.mjs.',
  );
}

const ontbrekend = Object.keys(COUNTRIES).filter((code) => !landen.some((l) => l.area === code));
if (ontbrekend.length) {
  throw new Error(`Geen kolom in de tabellen voor: ${ontbrekend.join(', ')}.`);
}

const euroArea = bouw(EURO_AREA.code, EURO_AREA.name);

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  new URL('index.json', OUT_DIR),
  JSON.stringify({
    source: {
      publisher: 'European Central Bank',
      survey: 'Household Finance and Consumption Survey',
      wave: log.wave,
      tables: log.xlsx,
      url: log.url,
      sha256: log.sha256,
      fetchedOn: log.fetchedOn,
      unit: 'EUR',
      /**
       * De definitie in de woorden van de uitgever, want juist hier zit het verschil
       * met het cijfer dat elders op de site staat.
       */
      definition:
        'Net wealth is the difference between total assets and total liabilities. ' +
        'The current value of public and occupational pension plans is not included.',
    },
    generated: new Date().toISOString().slice(0, 10),
    bands: AGE_BANDS,
    /**
     * Alleen de codes. De reden staat in NOT_BUILT in scripts/lib/hfcs.mjs en in
     * data/sources.md, allebei in het Nederlands — en dit bestand belandt via een
     * JSON-blok in een Engelse pagina. Eén keer stond die Nederlandse zin daar ook
     * werkelijk, kleingemaakt en wel.
     */
    notBuilt: Object.keys(NOT_BUILT),
    countries: landen,
    euroArea,
  }) + '\n',
);

const span = landen.map((l) => l.climb).filter(Boolean).sort((a, b) => a - b);
console.log(`HFCS golf ${log.wave}: ${landen.length} landen, ${AGE_BANDS.length} leeftijdsgroepen`);
console.log(`  veldwerk ${landen.map((l) => l.fieldwork.from).sort()[0]} tot ${landen.map((l) => l.fieldwork.to).sort().at(-1)}`);
console.log(`  jongste groep tot piek: ${span[0]}x tot ${span.at(-1)}x, midden ${span[Math.floor(span.length / 2)]}x`);
console.log(`  niet gebouwd: ${Object.keys(NOT_BUILT).join(', ') || 'geen'}`);
