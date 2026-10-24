/**
 * De poort voor elke metriek. Moet slagen voordat er iets gepubliceerd wordt.
 *
 *   node scripts/validate-metrics.mjs [key ...]
 */
import { validateMetric } from './lib/metric-build.mjs';
import { METRICS } from './metrics.mjs';

const wanted = process.argv.slice(2);
const todo = wanted.length ? METRICS.filter((m) => wanted.includes(m.key)) : METRICS;

let bad = 0;

for (const spec of todo) {
  try {
    const { failures, notes, compared, atLatest } = await validateMetric(spec);
    console.log(`\n${spec.key} (${spec.code})`);
    console.log(`  ${atLatest} landen op het laatste jaar, ${compared} gebieden teruggerekend naar het ruwe antwoord`);
    for (const note of notes) console.log(`  let op: ${note}`);
    if (failures.length) {
      bad += 1;
      console.error(`  ${failures.length} probleem(en):`);
      for (const failure of failures) console.error(`    - ${failure}`);
    } else {
      console.log('  in orde');
    }
  } catch (error) {
    bad += 1;
    console.error(`\n${spec.key}: ${String(error.message).split('\n')[0]}`);
  }
}

if (bad) {
  console.error(`\n${bad} metriek(en) niet in orde.`);
  process.exit(1);
}
console.log('\nAlles in orde.');
