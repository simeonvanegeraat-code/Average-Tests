/**
 * Bouwt de percentieltabellen uit de NHANES-microdata.
 *
 *   node scripts/fetch-nhanes.mjs      # eerst de data ophalen
 *   node scripts/build-percentiles.mjs
 *
 * Uitvoer: data/percentiles/<metriek>.json — per geslacht en per leeftijdsjaar de
 * lengte/gewicht bij percentiel 1 t/m 99. De site rekent daar alleen nog in.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readXpt } from './lib/xpt.mjs';
import { smoothedQuantilesByAge } from './lib/stats.mjs';
import {
  CYCLES, RAW_DIR, SEX, TOP_CODED_AGE,
  PUBLISH_AGE_MIN, PUBLISH_AGE_MAX, SUPPORT_AGE_MIN,
} from './lib/nhanes.mjs';

const OUT_DIR = new URL('../data/percentiles/', import.meta.url);
const BANDWIDTH = 6;                                     // jaren, tricube-kernel
const LEVELS = Array.from({ length: 99 }, (_, i) => i + 1);

const METRICS = [
  { key: 'height', column: 'BMXHT', unit: 'cm', decimals: 1, label: 'Standing height' },
  { key: 'weight', column: 'BMXWT', unit: 'kg', decimals: 1, label: 'Body weight' },
];

/** Leest één cyclus en levert per respondent leeftijd, geslacht, gewichtsfactor en metingen. */
async function loadCycle(cycle, periodShare) {
  const read = async (file) => readXpt(await readFile(new URL(file.name, RAW_DIR)));
  const demo = await read(cycle.files.demo);
  const body = await read(cycle.files.body);

  const bodyBySeqn = new Map(body.rows.map((r) => [r.SEQN, r]));

  return demo.rows.flatMap((d) => {
    const b = bodyBySeqn.get(d.SEQN);
    if (!b) return [];                                   // wel bevraagd, niet gemeten

    const weight = d[cycle.weightVar];
    if (!(weight > 0)) return [];                        // geen geldig MEC-gewicht

    const age = d.RIDAGEYR;
    if (age == null || age < SUPPORT_AGE_MIN) return [];
    if (age >= TOP_CODED_AGE) return [];                 // 80 = "80 of ouder", geen leeftijd

    const sex = SEX[d.RIAGENDR];
    if (!sex) return [];

    return [{
      sex,
      age,
      // Cycli van ongelijke lengte combineren: schaal naar het aandeel van de
      // totale periode. Bij gelijke lengtes is dit exact "deel door aantal cycli".
      weight: weight * periodShare,
      BMXHT: b.BMXHT,
      BMXWT: b.BMXWT,
    }];
  });
}

const totalYears = CYCLES.reduce((sum, c) => sum + c.years, 0);
const respondents = (
  await Promise.all(CYCLES.map((c) => loadCycle(c, c.years / totalYears)))
).flat();

console.log(`Respondenten van ${SUPPORT_AGE_MIN} t/m ${TOP_CODED_AGE - 1} jaar: ${respondents.length}`);

const ages = Array.from(
  { length: PUBLISH_AGE_MAX - PUBLISH_AGE_MIN + 1 },
  (_, i) => PUBLISH_AGE_MIN + i,
);

await mkdir(OUT_DIR, { recursive: true });

for (const metric of METRICS) {
  const bySex = {};
  let measured = 0;

  for (const [code, sex] of Object.entries(SEX)) {
    void code;
    const observations = respondents
      .filter((r) => r.sex === sex && r[metric.column] != null)
      .map((r) => ({ age: r.age, value: r[metric.column], weight: r.weight }));
    measured += observations.length;

    const curve = smoothedQuantilesByAge({ observations, ages, levels: LEVELS, bandwidth: BANDWIDTH });

    bySex[sex] = {
      respondents: observations.length,
      byAge: Object.fromEntries(
        [...curve].map(([age, cell]) => [age, {
          n: cell.effectiveN,
          p: cell.quantiles.map((v) => Number(v.toFixed(metric.decimals))),
        }]),
      ),
    };
  }

  const doc = {
    metric: metric.key,
    label: metric.label,
    unit: metric.unit,
    population: 'Civilian non-institutionalized U.S. adults',
    source: 'CDC/NCHS NHANES',
    cycles: CYCLES.map((c) => ({ id: c.id, label: c.label, weightVariable: c.weightVar })),
    method: `Survey-weighted quantiles, smoothed across age with a tricube kernel (bandwidth ${BANDWIDTH} years).`,
    ageRange: [PUBLISH_AGE_MIN, PUBLISH_AGE_MAX],
    percentileLevels: LEVELS,
    generated: new Date().toISOString().slice(0, 10),
    sex: bySex,
  };

  const path = new URL(`${metric.key}.json`, OUT_DIR);
  await writeFile(path, JSON.stringify(doc));
  const kb = (JSON.stringify(doc).length / 1024).toFixed(0);
  console.log(`  ${metric.key.padEnd(7)} ${String(measured).padStart(6)} metingen -> data/percentiles/${metric.key}.json (${kb} kB)`);
}
