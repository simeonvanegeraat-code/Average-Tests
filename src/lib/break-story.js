/**
 * De cijfers achter het artikel over de reeksbreuk van 2021.
 *
 * Alles wordt hier uitgerekend uit data/leaving-home/index.json, zodat geen zin in
 * het artikel kan achterblijven bij de data. Eurostat publiceert bij; een getal dat
 * met de hand in de kopij staat is precies de fout die niemand ziet.
 *
 * Deze reeks is het voorbeeld omdat hij het scherpst is, maar de breuk zelf raakt
 * bijna elke Eurostat-reeks op de site — zie METHODOLOGY in src/lib/methodology.js.
 *
 * EEN FUNCTIE VAN DE TAAL, SINDS 10 NOVEMBER 2026
 *
 * Dit bestand bestond uit modulevariabelen: `jumps`, `flagged`, `transition`, `sharpest`
 * en `comparable` werden één keer gerekend bij het laden. Eén module-instantie bedient
 * de hele bouw, dus die kan geen taal kennen — en de landnamen in `jumps` kwamen uit de
 * rúwe index, dus stond er op /nl/ een tabel met 31 Engelse landnamen. Dezelfde val als
 * in CATALOGUE, METHODOLOGY, notes.js en related.js, en met dezelfde oplossing: een
 * functie met een cache per taal.
 */
import { trend } from './metric.js';
import { localise } from './country-names.js';
import { DEFAULT_LOCALE } from './locales.js';
import rawIndex from '../../data/leaving-home/index.json';

const cache = new Map();

export function breakStory(lang = DEFAULT_LOCALE) {
  const found = cache.get(lang);
  if (found) return found;

  const index = localise(rawIndex, lang);

  const BREAK = index.lastBreak;
  const BEFORE = String(Number(BREAK) - 1);
  const AFTER = String(Number(BREAK) + 1);

  /** Spreiding en dekking in één jaar, over elk land dat dat jaar een waarde heeft. */
  const spreadAt = (year) => {
    const values = index.countries
      .map((country) => country.series?.[year])
      .filter((value) => typeof value === 'number');

    if (!values.length) return null;

    const low = Math.min(...values);
    const high = Math.max(...values);
    return { year, countries: values.length, low, high, spread: Math.round((high - low) * 10) / 10 };
  };

  /**
   * Wat elk land verschuift over de breuk heen. Niet "de verandering in 2021" — dat
   * zou suggereren dat er iets veranderd is. Het is het verschil tussen twee metingen
   * die niet dezelfde meting zijn.
   */
  const jumps = index.countries
    .map((country) => ({
      code: country.code,
      name: country.name,
      before: country.series?.[BEFORE] ?? null,
      after: country.series?.[BREAK] ?? null,
    }))
    .filter((row) => typeof row.before === 'number' && typeof row.after === 'number')
    .map((row) => ({ ...row, shift: Math.round((row.after - row.before) * 10) / 10 }))
    .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));

  /** Portugal valt op doordat het breukjaar zelf nergens op slaat: er en weer terug. */
  const transition = (() => {
    const country = index.countries.find((row) => row.code === 'PT');
    if (!country) return null;
    return {
      code: country.code,
      name: country.name,
      before: country.series?.[BEFORE] ?? null,
      twoBefore: country.series?.[String(Number(BREAK) - 2)] ?? null,
      at: country.series?.[BREAK] ?? null,
      after: country.series?.[AFTER] ?? null,
      latest: country.total,
    };
  })();

  /** Het land met de grootste verschuiving, en hoe het zich daarna gedraagt. */
  const sharpest = (() => {
    const row = jumps[0];
    if (!row) return null;
    const country = index.countries.find((c) => c.code === row.code);
    return { ...row, latest: country?.total ?? null, latestYear: country?.year ?? null };
  })();

  const story = {
    index,
    spreadAt,
    jumps,
    /** Landen die meer dan een heel jaar verschuiven: de breuk is dan niet subtiel. */
    bigJumps: jumps.filter((row) => Math.abs(row.shift) >= 1),
    /** Hoeveel landen dragen de vlag, en hoeveel zijn er in totaal. */
    flagged: {
      count: index.countries.filter((country) => country.breaks?.includes(BREAK)).length,
      of: index.countries.length,
    },
    transition,
    sharpest,
    years: {
      break: BREAK,
      before: BEFORE,
      after: AFTER,
      first: index.years?.[0] ?? null,
      last: index.years?.[index.years.length - 1] ?? null,
      comparableSince: index.comparableSince ?? null,
    },
    /** Het venster waarin wél gerekend mag worden, via dezelfde functie als de pagina's. */
    comparable: trend(index),
    source: index.source ?? {},
  };

  cache.set(lang, story);
  return story;
}
