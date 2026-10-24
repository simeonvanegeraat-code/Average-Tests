/**
 * Bouwt data/<key>/index.json voor elke metriek.
 *
 *   node scripts/build-metrics.mjs [key ...]
 */
import { buildMetric } from './lib/metric-build.mjs';
import { METRICS } from './metrics.mjs';

const wanted = process.argv.slice(2);
const todo = wanted.length ? METRICS.filter((m) => wanted.includes(m.key)) : METRICS;

for (const spec of todo) {
  try {
    const index = await buildMetric(spec);
    const current = index.countries.filter((c) => c.year === index.latestYear);
    const low = current[0];
    const high = current[current.length - 1];
    const window = index.comparableSince && index.comparableSince < index.latestYear
      ? `venster ${index.comparableSince}–${index.latestYear}`
      : 'GEEN venster';
    console.log(
      `${spec.key.padEnd(16)} ${String(current.length).padStart(2)} landen op ${index.latestYear}  ` +
        `${low.code} ${low.total} … ${high.code} ${high.total}  ${window}`,
    );
  } catch (error) {
    console.error(`${spec.key.padEnd(16)} MISLUKT: ${String(error.message).split('\n')[0]}`);
    process.exitCode = 1;
  }
}
