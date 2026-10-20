/**
 * Poort voor data/leaving-home/index.json. Moet slagen voordat er iets live gaat.
 *
 *   node scripts/validate-leaving-home.mjs
 *
 * De poort bestaat omdat de fouten die hier gemaakt kunnen worden niet opvallen.
 * Alle vier zien er op de pagina volkomen normaal uit:
 *
 *   - een aggregaat (EU27) dat als land wordt geteld;
 *   - een land uit 2019 in een ranglijst van 2025;
 *   - een stille codewissel bij Eurostat waardoor er een ander cijfer staat;
 *   - een vergelijking door de tijd die over een reeksbreuk heen stapt.
 *
 * Dat laatste is de gemeenste. De Labour Force Survey is in 2021 herzien en
 * vrijwel elk land heeft daar een breuk; het breukjaar zelf is bovendien een
 * overgangsjaar (Portugal 33,3 in 2021 tegen 30,1 in 2022 en 28,9 in 2019).
 * Wie zonder die kennis "sinds 2005" uitrekent, krijgt een getal dat echt lijkt.
 *
 * Elke controle rekent terug naar het ruwe antwoord of naar een grens die we
 * vooraf hebben vastgelegd; niets vertrouwt op het gebouwde bestand alleen.
 */
import { readFile } from 'node:fs/promises';
import { reader, AGGREGATES, RAW_DIR } from './lib/eurostat.mjs';

/** Leeftijd waarop jongeren het huis uit gaan. Buiten dit bereik is iets stuk. */
const PLAUSIBLE = { min: 15, max: 40 };
/** Minder landen dan dit betekent dat de dataset is ingestort, niet dat Europa kromp. */
const MIN_COUNTRIES_AT_LATEST = 25;

const index = JSON.parse(
  await readFile(new URL('../data/leaving-home/index.json', import.meta.url), 'utf8'),
);
const raw = JSON.parse(await readFile(new URL('yth_demo_030.json', RAW_DIR), 'utf8'));
const data = reader(raw);

const failures = [];
const notes = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// 1. Praten we nog over dezelfde dataset?
check(
  index.source.dataset === 'yth_demo_030',
  `Datasetcode is ${index.source.dataset}, verwacht yth_demo_030.`,
);
check(
  data.label === index.source.label,
  `Het label in het ruwe antwoord ("${data.label}") wijkt af van het gebouwde bestand ("${index.source.label}").`,
);
check(
  data.updated === index.source.eurostatUpdated,
  'De updatestempel van Eurostat is veranderd sinds de build. Draai de build opnieuw.',
);
check(
  Boolean(index.source.definition),
  'De definitie van Eurostat ontbreekt. De pagina leunt erop, want het label ' +
    '("estimated average age") zegt iets anders dan de definitie (de leeftijd waarop ' +
    '50% niet meer thuis woont).',
);

// 2. Aggregaten mogen nergens als land staan.
for (const country of index.countries) {
  check(!AGGREGATES.has(country.code), `${country.code} is een aggregaat maar staat bij de landen.`);
}
check(index.aggregates.length > 0, 'Geen enkel aggregaat bewaard; het EU-cijfer voor de kop ontbreekt.');
check(
  index.aggregates.some((a) => a.code === 'EU27_2020'),
  'EU27_2020 ontbreekt; dat is het cijfer in de kop.',
);

// 3. Elk land compleet en plausibel.
for (const country of index.countries) {
  const where = `${country.code} (${country.name})`;
  check(Boolean(country.name), `${country.code} heeft geen naam.`);
  check(typeof country.total === 'number', `${where} heeft geen totaal.`);
  check(
    typeof country.total === 'number' &&
      country.total >= PLAUSIBLE.min &&
      country.total <= PLAUSIBLE.max,
    `${where} heeft een onmogelijke waarde: ${country.total}.`,
  );
  check(index.years.includes(country.year), `${where} staat op jaar ${country.year}, buiten de reeks.`);
  check(Array.isArray(country.breaks), `${where} heeft geen breukenlijst.`);

  for (const year of Object.keys(country.series)) {
    check(index.years.includes(year), `${where} heeft een reekswaarde voor ${year}, buiten de reeks.`);
  }
  for (const year of country.breaks ?? []) {
    check(index.years.includes(year), `${where} heeft een breuk in ${year}, buiten de reeks.`);
  }
  if (country.men === null || country.women === null) {
    notes.push(`${where} heeft geen uitsplitsing naar geslacht voor ${country.year}.`);
  }
}

// 4. Het laatste jaar en het landental dat de kop gebruikt.
const maxYear = index.countries.reduce((max, c) => (c.year > max ? c.year : max), '0');
check(index.latestYear === maxYear, `latestYear is ${index.latestYear}, hoogste landjaar is ${maxYear}.`);

const atLatest = index.countries.filter((c) => c.year === index.latestYear);
check(
  index.countriesAtLatestYear === atLatest.length,
  `countriesAtLatestYear zegt ${index.countriesAtLatestYear}, geteld zijn het ${atLatest.length}.`,
);
check(
  atLatest.length >= MIN_COUNTRIES_AT_LATEST,
  `Maar ${atLatest.length} landen op ${index.latestYear}; onder de grens van ${MIN_COUNTRIES_AT_LATEST}.`,
);

const stale = index.countries.filter((c) => c.year !== index.latestYear);
if (stale.length) {
  notes.push(
    `Ouder dan ${index.latestYear}: ${stale.map((c) => `${c.code} ${c.year}`).join(', ')}. ` +
      'De pagina moet dat per land zichtbaar maken.',
  );
}

// 5. Reeksbreuken: bestaat het vergelijkbare venster, en is het echt breukvrij?
const breaksAmongCurrent = [...new Set(atLatest.flatMap((c) => c.breaks ?? []))].sort();
const expectedLastBreak = breaksAmongCurrent[breaksAmongCurrent.length - 1] ?? null;
check(
  index.lastBreak === expectedLastBreak,
  `lastBreak is ${index.lastBreak}, maar de laatste breuk onder de huidige landen is ${expectedLastBreak}.`,
);

const expectedSince = index.lastBreak
  ? (index.years[index.years.indexOf(index.lastBreak) + 1] ?? null)
  : index.years[0];
check(
  index.comparableSince === expectedSince,
  `comparableSince is ${index.comparableSince}, verwacht ${expectedSince} (het jaar ná de laatste breuk).`,
);
check(
  index.comparableSince !== null && index.comparableSince < index.latestYear,
  `Er is geen bruikbaar venster: comparableSince ${index.comparableSince} tegen latestYear ${index.latestYear}. ` +
    'De pagina mag dan geen enkele vergelijking door de tijd tonen.',
);

if (index.comparableSince) {
  for (const country of atLatest) {
    const inside = (country.breaks ?? []).filter(
      (year) => year > index.comparableSince && year <= index.latestYear,
    );
    check(
      inside.length === 0,
      `${country.code} heeft een breuk in ${inside.join(', ')}, binnen het venster ${index.comparableSince}–${index.latestYear}.`,
    );
  }
  notes.push(
    `Vergelijkbaar venster: ${index.comparableSince}–${index.latestYear}. ` +
      `Alles vóór ${index.comparableSince} mag niet met nu vergeleken worden.`,
  );
}

// 6. Onafhankelijk terugrekenen uit het ruwe antwoord. Dit is de echte controle:
//    hij slaat het gebouwde bestand over en vraagt Eurostat opnieuw om elk cijfer.
let compared = 0;
for (const area of [...index.countries, ...index.aggregates]) {
  const fromRaw = data.at({ freq: 'A', unit: 'AVG', sex: 'T', geo: area.code, time: area.year });
  check(fromRaw === area.total, `${area.code} ${area.year}: gebouwd ${area.total}, ruw ${fromRaw}.`);

  const flagsFromRaw = index.years.filter(
    (time) => data.statusAt({ freq: 'A', unit: 'AVG', sex: 'T', geo: area.code, time }) === 'b',
  );
  check(
    flagsFromRaw.join(',') === (area.breaks ?? []).join(','),
    `${area.code}: breuken gebouwd [${(area.breaks ?? []).join(',')}], ruw [${flagsFromRaw.join(',')}].`,
  );
  compared += 1;
}

// 7. Geen dubbele landcodes.
const codes = index.countries.map((c) => c.code);
check(new Set(codes).size === codes.length, 'Dubbele landcodes in de lijst.');

console.log(`Validatie leaving-home (${index.source.dataset}, Eurostat ${index.source.eurostatUpdated})`);
console.log(`  ${index.countries.length} landen, ${index.aggregates.length} aggregaten`);
console.log(`  ${atLatest.length} landen op ${index.latestYear}`);
console.log(`  laatste reeksbreuk ${index.lastBreak}, vergelijkbaar vanaf ${index.comparableSince}`);
console.log(`  ${compared} gebieden teruggerekend naar het ruwe antwoord, cijfer en breuken`);

for (const note of notes) console.log(`  let op: ${note}`);

if (failures.length) {
  console.error(`\n${failures.length} probleem(en):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('\nAlles in orde.');
