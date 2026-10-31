/**
 * De poort tussen "de pijplijn heeft iets geproduceerd" en "dit mag op de site".
 *
 *   node scripts/validate-hfcs.mjs
 *
 * Faalt met exitcode 1 als een controle niet slaagt.
 *
 * Het gebouwde bestand wordt hier niet geloofd: elk cijfer wordt opnieuw uit de ruwe
 * zip gelezen en ernaast gelegd. Dat is geen overdaad. De fout die tijdens het bouwen
 * werkelijk optrad was een kolomverschuiving van één, door zelfsluitende cellen in de
 * xlsx. Die geeft geen foutmelding, alleen de cijfers van België bij Tsjechië. Het
 * enige wat zoiets vangt is terugrekenen naar de bron.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { AGE_BANDS, COUNTRIES, EURO_AREA, NOT_BUILT, OUT_DIR, PLAUSIBLE, RAW_DIR, SCALE, SHEETS, fieldworkPeriod } from './lib/hfcs.mjs';
import { openWorkbook, readSheet, sheetByPrefix, zipEntries } from './lib/xlsx.mjs';

const failures = [];
const check = (ok, label, detail) => {
  console.log(`  ${ok ? 'OK  ' : 'FOUT'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const gebouwd = JSON.parse(await readFile(new URL('index.json', OUT_DIR), 'utf8'));
const log = JSON.parse(await readFile(new URL('fetch-log.json', RAW_DIR), 'utf8'));
const zip = await readFile(new URL('tables.zip', RAW_DIR));

console.log(`\nGecontroleerd: HFCS golf ${gebouwd.source.wave}, ${gebouwd.countries.length} landen`);

// --- 1. is dit nog hetzelfde bestand ----------------------------------------
console.log('\n1. Herkomst');
const sha = createHash('sha256').update(zip).digest('hex');
check(sha === log.sha256, 'sha256 van de zip klopt met het ophaallog', `${sha.slice(0, 16)}…`);
check(gebouwd.source.sha256 === sha, 'het gebouwde bestand draagt dezelfde hash');
check(
  gebouwd.source.url === log.url && /ecb\.europa\.eu/.test(log.url),
  'opgehaald bij de ECB zelf',
  log.url.replace('https://www.ecb.europa.eu', ''),
);

// --- 2. elk cijfer terug naar het tabblad ------------------------------------
console.log('\n2. Elk cijfer terug naar de ruwe tabellen');
const boek = await openWorkbook(zipEntries(zip).get(log.xlsx));
const med = readSheet(boek, sheetByPrefix(boek, SHEETS.medians).pad);
const gem = readSheet(boek, sheetByPrefix(boek, SHEETS.means).pad);

const kopRij = (rijen) => rijen.find((r) => r.filter((c) => /^[A-Z]{2}$/.test(c)).length > 5);
const kopM = kopRij(med);
const kopG = kopRij(gem);
check(
  JSON.stringify(kopM) === JSON.stringify(kopG),
  'medianen en gemiddelden hebben dezelfde kolomvolgorde',
  `${kopM.filter(Boolean).length} koppen`,
);

const kolomVan = (kop, code) => kop.findIndex((c) => (code === EURO_AREA.code ? EURO_AREA.header.test(c) : c === code));
const bandRij = (rijen, bandCode) => {
  const start = rijen.findIndex((r) => r[0] === 'Age of RP');
  for (let i = start; i < start + 2 * AGE_BANDS.length + 2; i += 1) {
    if (String(rijen[i]?.[1] ?? '').trim() === bandCode) return i;
  }
  return -1;
};
const totaalRij = (rijen) => rijen.findIndex((r) => r[0] === 'Total population');

const uitBlad = (rijen, rij, kol) => {
  const cel = String(rijen[rij]?.[kol] ?? '').trim();
  return cel === '' ? null : Math.round(Number(cel) * SCALE);
};
const foutUitBlad = (rijen, rij, kol) => {
  const m = /^\(([\d.]+)\)$/.exec(String(rijen[rij + 1]?.[kol] ?? '').trim());
  return m ? Math.round(Number(m[1]) * SCALE) : null;
};

let vergeleken = 0;
const afwijkingen = [];
for (const land of [...gebouwd.countries, gebouwd.euroArea]) {
  const kM = kolomVan(kopM, land.area);
  const kG = kolomVan(kopG, land.area);
  if (kM < 0 || kG < 0) {
    afwijkingen.push(`${land.area}: geen kolom in het tabblad`);
    continue;
  }
  const paren = [
    ['totaal/mediaan', land.total.median, uitBlad(med, totaalRij(med), kM)],
    ['totaal/gemiddelde', land.total.mean, uitBlad(gem, totaalRij(gem), kG)],
  ];
  for (const band of land.bands) {
    const rM = bandRij(med, band.code);
    const rG = bandRij(gem, band.code);
    paren.push(
      [`${band.code}/mediaan`, band.median, uitBlad(med, rM, kM)],
      [`${band.code}/gemiddelde`, band.mean, uitBlad(gem, rG, kG)],
      [`${band.code}/mediaan-se`, band.medianSe, foutUitBlad(med, rM, kM)],
      [`${band.code}/gemiddelde-se`, band.meanSe, foutUitBlad(gem, rG, kG)],
    );
  }
  for (const [wat, gebouwdeWaarde, uitTabel] of paren) {
    vergeleken += 1;
    if (gebouwdeWaarde !== uitTabel) afwijkingen.push(`${land.area}/${wat}: ${gebouwdeWaarde} ≠ ${uitTabel}`);
  }
}
check(afwijkingen.length === 0, 'elk gebouwd bedrag staat zo in de tabel',
  afwijkingen.length ? afwijkingen.slice(0, 4).join(' · ') : `${vergeleken} cijfers`);

// --- 3. volledigheid ---------------------------------------------------------
console.log('\n3. Volledigheid');
const alleLanden = [...gebouwd.countries, gebouwd.euroArea];
check(
  gebouwd.countries.length === Object.keys(COUNTRIES).length,
  'elk land van de vermogenspagina heeft een leeftijdsreeks',
  `${gebouwd.countries.length} van ${Object.keys(COUNTRIES).length}`,
);
const nietGebouwd = gebouwd.countries.filter((l) => NOT_BUILT[l.area]);
check(nietGebouwd.length === 0, 'landen uit NOT_BUILT staan er niet in', Object.keys(NOT_BUILT).join(', ') || 'geen');

const gaten = alleLanden.flatMap((l) =>
  l.bands
    .filter((b) => b.median === null || b.mean === null)
    .map((b) => `${l.area}/${b.code}`),
);
check(gaten.length === 0, 'geen enkele leeftijdsgroep zonder mediaan en gemiddelde',
  gaten.length ? gaten.slice(0, 5).join(' ') : `${alleLanden.length * AGE_BANDS.length} groepen`);

const verkeerdAantal = alleLanden.filter((l) => l.bands.length !== AGE_BANDS.length);
check(verkeerdAantal.length === 0, `elk gebied heeft ${AGE_BANDS.length} groepen`,
  verkeerdAantal.map((l) => l.area).join(' ') || 'alle');

// --- 4. de vorm die vermogen hoort te hebben ---------------------------------
console.log('\n4. Vorm van de verdeling');
// Vermogen is scheef naar boven: het gemiddelde ligt boven de mediaan. Ligt het
// eronder, dan zijn twee kolommen of twee tabbladen verwisseld.
const scheef = alleLanden.flatMap((l) =>
  l.bands.filter((b) => b.mean < b.median).map((b) => `${l.area}/${b.code}`),
);
check(scheef.length === 0, 'het gemiddelde ligt overal boven de mediaan',
  scheef.length ? scheef.slice(0, 5).join(' ') : 'alle groepen');

// De mediaan van de hele bevolking kan niet buiten het bereik van de groepsmedianen
// vallen; dat is rekenkundig onmogelijk en dus een goede test op een verschuiving.
const buitenBereik = alleLanden.filter((l) => {
  const m = l.bands.map((b) => b.median);
  return l.total.median < Math.min(...m) || l.total.median > Math.max(...m);
});
check(buitenBereik.length === 0, 'de totaalmediaan ligt tussen de groepsmedianen',
  buitenBereik.map((l) => l.area).join(' ') || `${alleLanden.length} gebieden`);

const onzin = alleLanden.flatMap((l) =>
  l.bands
    .filter((b) => b.median < PLAUSIBLE.min || b.median > PLAUSIBLE.max || b.mean > PLAUSIBLE.max)
    .map((b) => `${l.area}/${b.code}=${b.median}`),
);
check(onzin.length === 0, `elk bedrag tussen ${PLAUSIBLE.min} en ${PLAUSIBLE.max} euro`,
  onzin.length ? onzin.slice(0, 4).join(' ') : 'alle bedragen');

// --- 5. elk land draagt zijn eigen veldwerk ----------------------------------
console.log('\n5. Veldwerk per land');
const zonder = gebouwd.countries.filter((l) => !l.fieldwork?.from || !l.fieldwork?.to);
check(zonder.length === 0, 'elk land heeft een veldwerkperiode', zonder.map((l) => l.area).join(' ') || 'alle 21');

const omgekeerd = gebouwd.countries.filter((l) => l.fieldwork && l.fieldwork.from > l.fieldwork.to);
check(omgekeerd.length === 0, 'het veldwerk eindigt niet voor het begint', omgekeerd.map((l) => l.area).join(' ') || '');

const veldwerkBlad = readSheet(boek, sheetByPrefix(boek, SHEETS.fieldwork).pad);
const uitBladPerNaam = new Map();
for (const rij of veldwerkBlad) {
  const van = fieldworkPeriod(rij[1]);
  const tot = fieldworkPeriod(rij[2]);
  if (van && tot) uitBladPerNaam.set(String(rij[0]).trim(), `${van}..${tot}`);
}
const verkeerdVeldwerk = gebouwd.countries.filter(
  (l) => uitBladPerNaam.get(l.name) !== `${l.fieldwork.from}..${l.fieldwork.to}`,
);
check(verkeerdVeldwerk.length === 0, 'de veldwerkperiodes staan zo in het tabblad',
  verkeerdVeldwerk.map((l) => l.area).join(' ') || `${gebouwd.countries.length} landen`);

const periodes = gebouwd.countries.flatMap((l) => [l.fieldwork.from, l.fieldwork.to]).sort();
const spreiding = `${periodes[0]} tot ${periodes.at(-1)}`;
console.log(`        het veldwerk loopt van ${spreiding} — één jaartal erboven zou onwaar zijn`);

// --- klaar -------------------------------------------------------------------
await writeFile(
  new URL('../wealth-age-validation.json', OUT_DIR),
  JSON.stringify({
    checkedOn: new Date().toISOString().slice(0, 10),
    wave: gebouwd.source.wave,
    countries: gebouwd.countries.length,
    bands: AGE_BANDS.length,
    figuresChecked: vergeleken,
    fieldworkSpan: spreiding,
    sha256: sha,
  }, null, 2) + '\n',
);

if (failures.length) {
  console.error(`\n${failures.length} controle(s) gefaald:\n  - ${failures.join('\n  - ')}\n`);
  process.exit(1);
}
console.log(`\nAlles in orde. ${vergeleken} cijfers teruggerekend naar de tabellen.\n`);
