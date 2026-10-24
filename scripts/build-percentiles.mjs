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
import { smoothedQuantilesByAge, weightedQuantile } from './lib/stats.mjs';
import {
  CYCLES, RAW_DIR, SEX, TOP_CODED_AGE,
  PUBLISH_AGE_MIN, PUBLISH_AGE_MAX, SUPPORT_AGE_MIN,
} from './lib/nhanes.mjs';

const OUT_DIR = new URL('../data/percentiles/', import.meta.url);
const BANDWIDTH = 6;                                     // jaren, tricube-kernel
const LEVELS = Array.from({ length: 99 }, (_, i) => i + 1);

// Drempels waarvoor we het aantal mensen erboven uitrekenen. Voor lengte elke hele
// inch van 4'10" tot 6'10", want dat is hoe het Amerikaanse publiek erover praat en
// ernaar zoekt; voor gewicht elke 10 pond van 100 tot 350.
const inchesToCm = (inch) => inch * 2.54;
const poundsToKg = (lb) => lb / 2.2046226218;
const range = (from, to, step) =>
  Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step);

const METRICS = [
  {
    key: 'height', column: 'BMXHT', unit: 'cm', decimals: 1, label: 'Standing height',
    thresholds: range(58, 82, 1).map(inchesToCm),
  },
  {
    key: 'weight', column: 'BMXWT', unit: 'kg', decimals: 1, label: 'Body weight',
    thresholds: range(100, 350, 10).map(poundsToKg),
  },
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

// Leeftijdsbanden voor de samenvattende tabel op de metriekpagina's.
const BANDS = [
  { label: '20-29', from: 20, to: 29 },
  { label: '30-39', from: 30, to: 39 },
  { label: '40-49', from: 40, to: 49 },
  { label: '50-59', from: 50, to: 59 },
  { label: '60-69', from: 60, to: 69 },
  { label: '70-79', from: 70, to: 79 },
];

/**
 * Percentielen voor een leeftijdsbereik, rechtstreeks gewogen uit de microdata.
 *
 * Dit mag NIET worden benaderd door de gladgestreken curves per leeftijdsjaar te
 * middelen: die weegt elk leeftijdsjaar even zwaar, terwijl leeftijdsjaren
 * verschillend bevolkt zijn. Het verschil is klein maar de uitkomst zou dan geen
 * mediaan meer zijn, en dat is precies wat we op zo'n pagina beweren.
 */
function bandQuantiles(observations, from, to, levels) {
  const rows = observations
    .filter((o) => o.age >= from && o.age <= to)
    .map((o) => ({ value: o.value, weight: o.weight }))
    .sort((a, b) => a.value - b.value);

  const out = {};
  for (const level of levels) out[`p${level}`] = Number(weightedQuantile(rows, level / 100).toFixed(1));
  out.n = rows.length;
  return out;
}

const SUMMARY_LEVELS = [10, 25, 50, 75, 90];

/**
 * Hoeveel Amerikanen zitten op of boven een drempel?
 *
 * Dit kan alleen uit microdata. De steekproefgewichten sommeren naar de werkelijke
 * bevolking, dus de som van de gewichten boven een grens is een schatting van het
 * aantal mensen erboven — niet alleen een percentage. Een gepubliceerd gemiddelde
 * draagt die informatie niet.
 *
 * De uitkomst is een schatting uit een steekproef; rond hem op de site af en
 * presenteer hem nooit als een exacte telling.
 */
function populationAbove(observations, thresholds) {
  const total = observations.reduce((sum, o) => sum + o.weight, 0);
  return thresholds.map((value) => {
    const at = observations.reduce((sum, o) => (o.value >= value ? sum + o.weight : sum), 0);
    return {
      value: Number(value.toFixed(1)),
      population: Math.round(at),
      share: Number(((at / total) * 100).toFixed(2)),
      // Aantal echte respondenten erboven: onder een handvol is de schatting te dun
      // om te tonen, en dat moet de pagina zelf kunnen zien.
      respondents: observations.filter((o) => o.value >= value).length,
    };
  });
}

for (const metric of METRICS) {
  const bySex = {};
  const aggregates = { overall: {}, bands: [] };
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

    // Let op: `observations` bevat ook 18- en 19-jarigen, puur als ondersteuning voor
    // de kernel aan de onderrand. Alles wat een uitspraak over de bevolking doet moet
    // daarom eerst op het gepubliceerde leeftijdsbereik filteren, anders telt het
    // mensen mee die nergens op de site voorkomen.
    const publishable = observations.filter(
      (o) => o.age >= PUBLISH_AGE_MIN && o.age <= PUBLISH_AGE_MAX,
    );

    aggregates.overall[sex] = bandQuantiles(observations, PUBLISH_AGE_MIN, PUBLISH_AGE_MAX, SUMMARY_LEVELS);
    aggregates.overall[sex].population = Math.round(publishable.reduce((s, o) => s + o.weight, 0));
    aggregates.thresholds ??= {};
    aggregates.thresholds[sex] = populationAbove(publishable, metric.thresholds);
    BANDS.forEach((band, i) => {
      aggregates.bands[i] ??= { label: band.label, from: band.from, to: band.to };
      aggregates.bands[i][sex] = bandQuantiles(observations, band.from, band.to, SUMMARY_LEVELS);
    });
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
    // Gewogen percentielen per leeftijdsbereik, rechtstreeks uit de microdata.
    // Gebruik deze voor samenvattende uitspraken; leid ze nooit af uit `byAge`.
    aggregates,
    sex: bySex,
  };

  const path = new URL(`${metric.key}.json`, OUT_DIR);
  await writeFile(path, JSON.stringify(doc));
  const kb = (JSON.stringify(doc).length / 1024).toFixed(0);
  console.log(`  ${metric.key.padEnd(7)} ${String(measured).padStart(6)} metingen -> data/percentiles/${metric.key}.json (${kb} kB)`);
}
