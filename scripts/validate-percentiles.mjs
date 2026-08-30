/**
 * Controleert de gegenereerde percentieltabellen. Draait na build-percentiles.mjs.
 *
 *   node scripts/validate-percentiles.mjs
 *
 * Faalt met exitcode 1 als een controle niet slaagt. Dit is de poort tussen "de
 * pipeline heeft iets uitgerekend" en "we durven dit op de site te zetten".
 */
import { readFile } from 'node:fs/promises';
import { readXpt } from './lib/xpt.mjs';
import { weightedQuantile } from './lib/stats.mjs';
import { CYCLES, RAW_DIR, SEX, TOP_CODED_AGE } from './lib/nhanes.mjs';

const failures = [];
const check = (ok, label, detail) => {
  console.log(`  ${ok ? 'OK  ' : 'FOUT'}  ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

// --- ruwe data opnieuw inlezen, los van de buildstap -------------------------
const totalYears = CYCLES.reduce((s, c) => s + c.years, 0);
const raw = [];
for (const cycle of CYCLES) {
  const read = async (f) => readXpt(await readFile(new URL(f.name, RAW_DIR)));
  const demo = await read(cycle.files.demo);
  const body = await read(cycle.files.body);
  const bySeqn = new Map(body.rows.map((r) => [r.SEQN, r]));
  for (const d of demo.rows) {
    const b = bySeqn.get(d.SEQN);
    const w = d[cycle.weightVar];
    if (!b || !(w > 0) || d.RIDAGEYR == null || d.RIDAGEYR >= TOP_CODED_AGE) continue;
    if (!SEX[d.RIAGENDR]) continue;
    raw.push({
      sex: SEX[d.RIAGENDR], age: d.RIDAGEYR,
      weight: w * (cycle.years / totalYears),
      height: b.BMXHT, weight_kg: b.BMXWT,
    });
  }
}

const rawQuantile = (rows, field, p) => {
  const s = rows.filter((r) => r[field] != null)
    .map((r) => ({ value: r[field], weight: r.weight }))
    .sort((a, b) => a.value - b.value);
  return weightedQuantile(s, p);
};

const height = JSON.parse(await readFile(new URL('../data/percentiles/height.json', import.meta.url)));

// --- 1. monotoniciteit: p1 < p2 < ... < p99 ---------------------------------
console.log('\n1. Percentielen lopen op binnen elke leeftijd');
let monoBreaks = 0, cells = 0;
for (const sex of Object.keys(height.sex)) {
  for (const cell of Object.values(height.sex[sex].byAge)) {
    cells++;
    for (let i = 1; i < cell.p.length; i++) if (cell.p[i] < cell.p[i - 1]) monoBreaks++;
  }
}
check(monoBreaks === 0, `geen dalende percentielen`, `${cells} leeftijdscellen gecontroleerd`);

// --- 2. gladgestreken vs ruwe percentielen in brede banden ------------------
console.log('\n2. Gladgestreken curve vs ruwe gewogen percentielen per leeftijdsband');
const bands = [[20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79]];
let worstGap = 0;
for (const sex of ['male', 'female']) {
  for (const [lo, hi] of bands) {
    const inBand = raw.filter((r) => r.sex === sex && r.age >= lo && r.age <= hi);
    for (const p of [10, 50, 90]) {
      const rawVal = rawQuantile(inBand, 'height', p / 100);
      // curve middelen over de band, zodat we appels met appels vergelijken
      const ages = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
      const smooth = ages.reduce((s, a) => s + height.sex[sex].byAge[a].p[p - 1], 0) / ages.length;
      const gap = Math.abs(smooth - rawVal);
      worstGap = Math.max(worstGap, gap);
      if (gap > 0.6) {
        console.log(`        ${sex} ${lo}-${hi} p${p}: ruw ${rawVal.toFixed(1)} vs glad ${smooth.toFixed(1)} (${gap.toFixed(2)} cm)`);
      }
    }
  }
}
check(worstGap <= 0.6, 'grootste afwijking binnen 0,6 cm', `max ${worstGap.toFixed(2)} cm over 36 vergelijkingen`);

// --- 3. gewogen gemiddelden reproduceren de NCHS-publicatie -----------------
//
// Dit is de externe controle op de hele keten: XPT-lezer, weging, merge en filter.
// Referentie: CDC/NCHS FastStats "Body Measurements", dat expliciet citeert uit
// "Anthropometric Reference Data for Children and Adults: United States,
// August 2021-August 2023, tables 4, 8, 12" (pagina gelezen op 2026-08-30).
// We rekenen daarom precies die cyclus na, met alleen het gewicht van die cyclus.
//
// De gepubliceerde waarden zijn afgerond op 1 decimaal, dus vergelijken we op de
// afgeronde waarde. Een strakkere marge zou een verschil claimen dat de publicatie
// helemaal niet uitdrukt.
console.log('\n3. Gewogen gemiddelden 20+ tegen de NCHS-publicatie (aug 2021 - aug 2023)');
{
  const cycle = CYCLES.find((c) => c.id === 'L');
  const read = async (f) => readXpt(await readFile(new URL(f.name, RAW_DIR)));
  const demo = await read(cycle.files.demo);
  const body = await read(cycle.files.body);
  const bySeqn = new Map(body.rows.map((r) => [r.SEQN, r]));

  const rows = [];
  for (const d of demo.rows) {
    const b = bySeqn.get(d.SEQN);
    const w = d[cycle.weightVar];
    if (!b || !(w > 0) || d.RIDAGEYR < 20 || !SEX[d.RIAGENDR]) continue;
    rows.push({ sex: SEX[d.RIAGENDR], weight: w, BMXHT: b.BMXHT, BMXWT: b.BMXWT });
  }

  const published = {
    male:   { BMXHT: 68.9, BMXWT: 199.0 },
    female: { BMXHT: 63.5, BMXWT: 171.8 },
  };
  const toImperial = { BMXHT: (cm) => cm / 2.54, BMXWT: (kg) => kg * 2.2046226218 };
  const unit = { BMXHT: 'inch', BMXWT: 'lb' };

  for (const sex of ['male', 'female']) {
    for (const column of ['BMXHT', 'BMXWT']) {
      let sw = 0, sx = 0;
      for (const r of rows) {
        if (r.sex !== sex || r[column] == null) continue;
        sw += r.weight; sx += r.weight * r[column];
      }
      const value = toImperial[column](sx / sw);
      const expected = published[sex][column];
      check(Number(value.toFixed(1)) === expected, `${sex} ${column}`,
        `berekend ${value.toFixed(2)} -> ${value.toFixed(1)} ${unit[column]}, gepubliceerd ${expected.toFixed(1)}`);
    }
  }
}

// --- 4. dekking: genoeg respondenten achter elke leeftijd ------------------
console.log('\n4. Effectief aantal respondenten per leeftijdscel');
let thinnest = Infinity, thinnestAt = '';
for (const sex of ['male', 'female']) {
  for (const [age, cell] of Object.entries(height.sex[sex].byAge)) {
    if (cell.n < thinnest) { thinnest = cell.n; thinnestAt = `${sex} ${age}`; }
  }
}
check(thinnest >= 200, 'dunste cel heeft >= 200 effectieve respondenten',
  `minimum ${thinnest} bij ${thinnestAt}`);

// --- resultaat --------------------------------------------------------------
console.log(failures.length === 0
  ? '\nAlle controles geslaagd.'
  : `\n${failures.length} controle(s) gefaald: ${failures.join(', ')}`);
process.exit(failures.length === 0 ? 0 : 1);
