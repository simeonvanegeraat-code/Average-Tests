/**
 * De cijfers achter het artikel over de reeksbreuk van 2021.
 *
 * Alles wordt hier uitgerekend uit data/leaving-home/index.json, zodat geen zin in
 * het artikel kan achterblijven bij de data. Eurostat publiceert bij; een getal dat
 * met de hand in de kopij staat is precies de fout die niemand ziet.
 *
 * Deze reeks is het voorbeeld omdat hij het scherpst is, maar de breuk zelf raakt
 * bijna elke Eurostat-reeks op de site — zie METHODOLOGY in src/lib/methodology.js.
 */
import { trend } from './metric.js';
import index from '../../data/leaving-home/index.json';

const BREAK = index.lastBreak;
const BEFORE = String(Number(BREAK) - 1);
const AFTER = String(Number(BREAK) + 1);

/** Spreiding en dekking in één jaar, over elk land dat dat jaar een waarde heeft. */
export function spreadAt(year) {
  const values = index.countries
    .map((country) => country.series?.[year])
    .filter((value) => typeof value === 'number');

  if (!values.length) return null;

  const low = Math.min(...values);
  const high = Math.max(...values);
  return { year, countries: values.length, low, high, spread: Math.round((high - low) * 10) / 10 };
}

/**
 * Wat elk land verschuift over de breuk heen. Niet "de verandering in 2021" — dat
 * zou suggereren dat er iets veranderd is. Het is het verschil tussen twee metingen
 * die niet dezelfde meting zijn.
 */
export const jumps = index.countries
  .map((country) => ({
    code: country.code,
    name: country.name,
    before: country.series?.[BEFORE] ?? null,
    after: country.series?.[BREAK] ?? null,
  }))
  .filter((row) => typeof row.before === 'number' && typeof row.after === 'number')
  .map((row) => ({ ...row, shift: Math.round((row.after - row.before) * 10) / 10 }))
  .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));

/** Landen die meer dan een heel jaar verschuiven: de breuk is dan niet subtiel. */
export const bigJumps = jumps.filter((row) => Math.abs(row.shift) >= 1);

/** Hoeveel landen dragen de vlag, en hoeveel zijn er in totaal. */
export const flagged = {
  count: index.countries.filter((country) => country.breaks?.includes(BREAK)).length,
  of: index.countries.length,
};

/** Portugal valt op doordat het breukjaar zelf nergens op slaat: er en weer terug. */
export const transition = (() => {
  const country = index.countries.find((row) => row.code === 'PT');
  if (!country) return null;
  return {
    name: country.name,
    before: country.series?.[BEFORE] ?? null,
    twoBefore: country.series?.[String(Number(BREAK) - 2)] ?? null,
    at: country.series?.[BREAK] ?? null,
    after: country.series?.[AFTER] ?? null,
    latest: country.total,
  };
})();

/** Het land met de grootste verschuiving, en hoe het zich daarna gedraagt. */
export const sharpest = (() => {
  const row = jumps[0];
  if (!row) return null;
  const country = index.countries.find((c) => c.code === row.code);
  return { ...row, latest: country?.total ?? null, latestYear: country?.year ?? null };
})();

export const years = {
  break: BREAK,
  before: BEFORE,
  after: AFTER,
  first: index.years?.[0] ?? null,
  last: index.years?.[index.years.length - 1] ?? null,
  comparableSince: index.comparableSince ?? null,
};

/** Het venster waarin wél gerekend mag worden, via dezelfde functie als de pagina's. */
export const comparable = trend(index);

export const source = index.source ?? {};
