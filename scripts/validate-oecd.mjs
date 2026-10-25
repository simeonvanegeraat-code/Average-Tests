/**
 * De poort voor de OECD-uittreedleeftijd. Moet slagen voordat er iets gepubliceerd wordt.
 *
 *   node scripts/validate-oecd.mjs
 *
 * De poort gelooft het gebouwde bestand niet. Hij legt zelf een tabel aan van elke
 * waarneming in het ruwe antwoord en controleert daartegen: elk cijfer in de reeks,
 * het gekozen jaar, en of er geen latere jaargang is waarin beide geslachten staan.
 *
 * Drie controles zijn er speciaal voor deze bron:
 *
 * 1. Er mag geen veld in staan dat mannen en vrouwen samenvat. De OECD publiceert
 *    geen totaal en een gemiddelde van de twee zou een verzonnen cijfer zijn.
 * 2. Zodra de OECD wel een totaal gaat publiceren, moet de pagina herzien worden in
 *    plaats van stil hetzelfde te blijven zeggen.
 * 3. Elke waarneming staat vandaag op OBS_STATUS A. De pagina rekent over 55 jaar
 *    heen; komt er ooit een breuk of een schatting bij, dan moet dat opvallen
 *    voordat er een trendzin op staat.
 */
import { readFile } from 'node:fs/promises';
import { readObservations, isCountry } from './lib/oecd.mjs';
import { PENSION } from './oecd.mjs';

const RAW = new URL('../data/raw/oecd/', import.meta.url);
const DATA = new URL('../data/', import.meta.url);

/** De vangrail tegen schaalfouten: een uittreedleeftijd ligt hiertussen of er is iets mis. */
const PLAUSIBLE = { min: 45, max: 80 };
const MIN_COUNTRIES = 25;

/** Velden die niet mogen bestaan: ze zouden mannen en vrouwen tot een cijfer maken. */
const VERBODEN = ['total', 'avg', 'average', 'both', 'mean'];

const failures = [];
const notes = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const raw = JSON.parse(await readFile(new URL(`${PENSION.key}.json`, RAW), 'utf8'));
const index = JSON.parse(await readFile(new URL(`${PENSION.key}/index.json`, DATA), 'utf8'));
const { rows, times } = readObservations(raw.json);

check(index.source.dataset === PENSION.dataflow, `Dataflow is ${index.source.dataset}, verwacht ${PENSION.dataflow}.`);
check(index.source.measure === PENSION.measure, `Maat is ${index.source.measure}, verwacht ${PENSION.measure}.`);
check(rows.every((row) => row.MEASURE === PENSION.measure), 'Het ruwe antwoord bevat een andere maat dan ELMEA.');
check(rows.every((row) => row.UNIT_MEASURE === 'Y'), 'Het ruwe antwoord bevat een andere eenheid dan jaren.');
check(index.years.join(',') === times.join(','), 'De jarenreeks in het bestand wijkt af van het ruwe antwoord.');

const statussen = [...new Set(rows.map((row) => row.OBS_STATUS))].sort();
check(
  statussen.join('/') === 'A',
  `Niet elke waarneming is een normale waarde: status ${statussen.join('/')}. De pagina rekent over de hele reeks; bekijk dit eerst.`,
);

const seksen = [...new Set(rows.map((row) => row.SEX))].sort();
check(
  seksen.join('/') === 'F/M',
  `Het ruwe antwoord heeft nu geslacht ${seksen.join('/')}. Is er een totaal bij gekomen, dan moet de pagina herzien worden.`,
);

/** Elke waarneming uit het ruwe antwoord, plat opgezocht op gebied, jaar en geslacht. */
const ruw = new Map();
for (const row of rows) ruw.set(`${row.REF_AREA}|${row.time}|${row.SEX}`, row.value);

const areas = [
  ...index.countries.map((area) => ({ area, land: true })),
  ...index.aggregates.map((area) => ({ area, land: false })),
];

let compared = 0;
for (const { area, land } of areas) {
  const where = `${area.code} (${area.name})`;
  const hoort = land ? 'bij de landen' : 'bij de aggregaten';
  check(isCountry(area.code) === land, `${area.code} staat ${hoort} maar hoort daar niet.`);
  check(index.years.includes(area.year), `${where} staat op jaar ${area.year}, buiten de reeks.`);

  for (const veld of VERBODEN) {
    check(!(veld in area), `${where} heeft een veld ${veld}; mannen en vrouwen mogen niet samengevat worden.`);
  }

  for (const [veld, sex] of [
    ['men', 'M'],
    ['women', 'F'],
  ]) {
    // Eerst het kopcijfer van dit gebied.
    const fromRaw = ruw.get(`${area.code}|${area.year}|${sex}`);
    check(fromRaw === area[veld], `${where} ${veld} ${area.year}: gebouwd ${area[veld]}, ruw ${fromRaw}.`);
    check(
      area[veld] >= PLAUSIBLE.min && area[veld] <= PLAUSIBLE.max,
      `${where} ${veld} valt buiten het verwachte bereik ${PLAUSIBLE.min}-${PLAUSIBLE.max}: ${area[veld]}.`,
    );

    // En dan de hele reeks, want daar rekent de pagina over.
    const series = area.series?.[veld] ?? {};
    const inRaw = index.years.filter((jaar) => typeof ruw.get(`${area.code}|${jaar}|${sex}`) === 'number');
    check(
      Object.keys(series).sort().join(',') === inRaw.join(','),
      `${where} ${veld}: de reeks heeft ${Object.keys(series).length} jaren, het ruwe antwoord ${inRaw.length}.`,
    );
    for (const [jaar, value] of Object.entries(series)) {
      const ruwe = ruw.get(`${area.code}|${jaar}|${sex}`);
      if (ruwe !== value) failures.push(`${where} ${veld} ${jaar}: gebouwd ${value}, ruw ${ruwe}.`);
      compared += 1;
    }
  }

  // Is dit echt de laatste jaargang met beide geslachten?
  const later = index.years.filter(
    (jaar) =>
      Number(jaar) > Number(area.year) &&
      typeof ruw.get(`${area.code}|${jaar}|M`) === 'number' &&
      typeof ruw.get(`${area.code}|${jaar}|F`) === 'number',
  );
  check(later.length === 0, `${where} staat op ${area.year} maar heeft beide geslachten ook in ${later.join(', ')}.`);

  const gap = Math.round((area.men - area.women) * 100) / 100;
  check(area.gap === gap, `${where}: gap gebouwd ${area.gap}, gerekend ${gap}.`);
}

const codes = index.countries.map((area) => area.code);
check(new Set(codes).size === codes.length, 'Dubbele landcodes.');
check(codes.length >= MIN_COUNTRIES, `Maar ${codes.length} landen; onder de grens van ${MIN_COUNTRIES}.`);

const maxYear = index.countries.reduce((max, area) => (Number(area.year) > Number(max) ? area.year : max), '0');
check(index.latestYear === maxYear, `latestYear is ${index.latestYear}, hoogste landjaar is ${maxYear}.`);

const atLatest = index.countries.filter((area) => area.year === index.latestYear).length;
check(index.countriesAtLatestYear === atLatest, `countriesAtLatestYear zegt ${index.countriesAtLatestYear}, geteld ${atLatest}.`);

/** Gebieden die in het ruwe antwoord staan maar niet in het bestand: altijd een reden willen weten. */
const gebieden = [...new Set(rows.map((row) => row.REF_AREA))];
const gebouwd = new Set(areas.map(({ area }) => area.code));
const gemist = gebieden.filter((code) => !gebouwd.has(code));
notes.push(`Aggregaten apart gehouden: ${index.aggregates.map((area) => area.code).join(', ') || 'geen'}.`);
if (gemist.length) notes.push(`Geen jaargang met beide geslachten: ${gemist.join(', ')}.`);

const stale = index.countries.filter((area) => area.year !== index.latestYear);
if (stale.length) notes.push(`Ouder dan ${index.latestYear}: ${stale.map((area) => `${area.code} ${area.year}`).join(', ')}.`);

const verschil = index.countries.map((area) => area.gap);
const gemiddeld = Math.round((verschil.reduce((sum, value) => sum + value, 0) / verschil.length) * 100) / 100;
notes.push(`Verschil mannen min vrouwen: gemiddeld ${gemiddeld}, van ${Math.min(...verschil)} tot ${Math.max(...verschil)}.`);

console.log(`\n${PENSION.key} (${PENSION.dataflow})`);
console.log(`  ${codes.length} landen, ${atLatest} op ${index.latestYear}, ${compared} cijfers teruggerekend naar het ruwe antwoord`);
for (const note of notes) console.log(`  let op: ${note}`);

if (failures.length) {
  console.error(`  ${failures.length} probleem(en):`);
  for (const failure of failures) console.error(`    - ${failure}`);
  process.exit(1);
}
console.log('  in orde\n');
