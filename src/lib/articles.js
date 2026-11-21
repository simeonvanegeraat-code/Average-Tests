/**
 * De cijfers van de tien artikelen per metriek op /notes/ (21 november 2026).
 *
 * Elk artikel bespreekt de nieuwste cijfers van één metriek en linkt naar die pagina.
 * Geen enkel getal staat met de hand in een artikel: alles hieronder rekent uit de
 * databestanden, met dezelfde functies als de metriekpagina's. Publiceert een bron bij,
 * dan schuift het artikel mee. Zijn een zin en de nieuwe cijfers het dan niet meer eens
 * (een "rose" die een daling wordt), dan rekent de zin zelf de richting uit; zie de
 * pagina's.
 *
 * De schrijfregels staan in research/writing-rules.md.
 *
 * Alleen op de server: dit leest elf databestanden.
 */
import { headline, genderGap, trend, unbrokenRun, euAggregate, currentCountries, formatValue } from './metric.js';
import { localise } from './country-names.js';
import { spacePerPerson } from './space-per-person.js';
import { standsOut, commonWindow } from './wealth-standout.js';
import { DEFAULT_LOCALE } from './locales.js';
import { grouped } from './format.js';

import leavingHomeData from '../../data/leaving-home/index.json';
import householdSizeData from '../../data/household-size/index.json';
import dwellingSizeData from '../../data/dwelling-size/index.json';
import workingLifeData from '../../data/working-life/index.json';
import workingHoursData from '../../data/working-hours/index.json';
import unemploymentData from '../../data/unemployment/index.json';
import pensionAgeData from '../../data/pension-age/index.json';
import healthyYearsData from '../../data/healthy-years/index.json';
import firstChildData from '../../data/first-child/index.json';
import wealthIndexData from '../../data/wealth/index.json';
import euroAreaData from '../../data/wealth/i9.json';

const WEALTH_FILES = import.meta.glob('../../data/wealth/*.json', { eager: true, import: 'default' });
const WEALTH_COUNTRIES = Object.entries(WEALTH_FILES)
  .filter(([path]) => /\/[a-z]{2}\.json$/.test(path))
  .map(([, country]) => country);

/** Getallen in de notatie van de taal, met het aantal decimalen dat de bron gebruikt. */
const fmt = (value, decimals = 1, lang = DEFAULT_LOCALE) => formatValue(value, { decimals, locale: lang });

/** Het EU-cijfer van een eerdere periode, uit de reeks van het aggregaat. */
const euAt = (index, period) => euAggregate(index)?.series?.[period] ?? null;

/** De bron zoals hij onder elk artikel staat. */
const sourceOf = (index) => ({
  publisher: index.source?.publisher ?? 'Eurostat',
  dataset: index.source?.dataset ?? '',
  updated: String(index.source?.eurostatUpdated ?? '').slice(0, 10),
});

/** Wat er in het laatste jaar veranderde, alleen voor landen zonder breuk in dat jaar. */
function lastYearMoves(index) {
  const eu = euAggregate(index);
  const periods = Object.keys(eu?.series ?? {}).sort();
  const prev = periods.at(-2);
  if (!prev) return null;
  const rows = currentCountries(index)
    .filter((c) => c.series[prev] !== undefined && !c.breaks.includes(index.latestYear))
    .map((c) => ({ ...c, change: c.total - c.series[prev] }))
    .sort((a, b) => a.change - b.change);
  return {
    prev,
    rows,
    up: rows.filter((r) => r.change > 0),
    down: rows.filter((r) => r.change < 0),
    same: rows.filter((r) => r.change === 0),
    euPrev: eu?.series?.[prev] ?? null,
  };
}

export function articleFacts(key, lang = DEFAULT_LOCALE) {
  const L = (index) => localise(index, lang);

  switch (key) {
    case 'leaving-home': {
      const idx = L(leavingHomeData);
      return { idx, h: headline(idx), t: trend(idx), g: genderGap(idx), source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'household-size': {
      const idx = L(householdSizeData);
      const space = spacePerPerson(L(dwellingSizeData), idx);
      const lastBreakCount = currentCountries(idx).filter((c) => c.breaks.includes(idx.latestYear)).length;
      return { idx, h: headline(idx), space, lastBreakCount, u: unbrokenRun(idx), source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'dwelling-size': {
      const idx = L(dwellingSizeData);
      const space = spacePerPerson(idx, L(householdSizeData));
      /** Een eenheid omrekenen is geen statistiek: 1 m² is per definitie 10,7639 ft². */
      const SQFT = 10.7639;
      return { idx, h: headline(idx), space, sqft: (m2) => grouped(m2 * SQFT, { locale: lang }), source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'working-life': {
      const idx = L(workingLifeData);
      return { idx, h: headline(idx), u: unbrokenRun(idx, { minimumMove: 0.05 }), g: genderGap(idx), y: lastYearMoves(idx), source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'working-hours': {
      const idx = L(workingHoursData);
      const periods = Object.keys(euAggregate(idx)?.series ?? {}).sort();
      return { idx, h: headline(idx), g: genderGap(idx), first: periods[0], euFirst: euAt(idx, periods[0]), source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'unemployment': {
      const idx = L(unemploymentData);
      const cur = currentCountries(idx).sort((a, b) => b.total - a.total);
      const u = unbrokenRun(idx);
      const from = u?.from ?? null;
      const then = from
        ? idx.countries.filter((c) => c.series[from] !== undefined).sort((a, b) => b.series[from] - a.series[from])
        : [];
      return { idx, h: headline(idx), cur, u, from, then, source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'pension-age': {
      const idx = L(pensionAgeData);
      return { idx, h: headline(idx), g: genderGap(idx), source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'healthy-years': {
      const idx = L(healthyYearsData);
      const eu = euAggregate(idx);
      const periods = Object.keys(eu?.series ?? {}).sort();
      /** De grootste stap van een jaar op het volgende in de EU-reeks, buiten breukjaren. */
      const steps = periods.slice(1).map((p, i) => ({ from: periods[i], to: p, change: eu.series[p] - eu.series[periods[i]], broken: (eu.breaks ?? []).includes(p) }));
      const lastStep = steps.at(-1);
      const biggestBefore = steps.slice(0, -1).filter((s) => !s.broken).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
      const flagged = currentCountries(idx).filter((c) => c.breaks.includes(idx.latestYear));
      return { idx, h: headline(idx), g: genderGap(idx), y: lastYearMoves(idx), lastStep, biggestBefore, flagged, first: periods[0], source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'first-child': {
      const idx = L(firstChildData);
      return { idx, h: headline(idx), y: lastYearMoves(idx), source: sourceOf(idx), fmt: (v) => fmt(v, 1, lang) };
    }
    case 'wealth': {
      const named = L(wealthIndexData);
      const result = standsOut(WEALTH_COUNTRIES, euroAreaData);
      const window = commonWindow(WEALTH_COUNTRIES);
      const nameOf = Object.fromEntries(named.countries.map((c) => [c.area, c.name]));
      const growth = WEALTH_COUNTRIES
        .map((c) => ({ area: c.area, name: nameOf[c.area] ?? c.name, change: result.byArea[c.area].all.find((m) => m.key === 'growth')?.value ?? null }))
        .filter((r) => r.change !== null)
        .sort((a, b) => b.change - a.change);
      const median = named.countries.filter((c) => typeof c.median === 'number').sort((a, b) => b.median - a.median);
      return {
        window,
        growth,
        euroAreaGrowth: result.euroAreaGrowth,
        median,
        euroArea: named.euroArea,
        rose: growth.filter((r) => r.change > 0).length,
        fell: growth.filter((r) => r.change < 0).length,
        source: { publisher: 'European Central Bank', dataset: 'Distributional Wealth Accounts', updated: wealthIndexData.generated },
        pct: (v) => fmt(Math.abs(v) * 100, 1, lang),
      };
    }
    default:
      throw new Error(`articleFacts: geen artikel voor ${key}`);
  }
}

/**
 * Een Engelse opsomming: "Malta", "Malta and Denmark", "Spain, Italy and Portugal".
 * Alleen voor de artikelen, die voorlopig alleen Engels zijn.
 */
export function andList(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/**
 * Een bewering in een artikel die niet uit één getal volgt: een kop als "The gap between
 * countries is closing" of "A jump in the European figure". De getallen in een artikel
 * schuiven mee als de bron bijwerkt; zo'n zin niet. Klopt hij niet meer, dan stopt de
 * build hier, met de zin erbij, in plaats van dat de pagina iets beweert wat de data
 * tegenspreekt. Dan moet het artikel herschreven worden; dat is de bedoeling.
 */
export function claim(holds, sentence) {
  if (!holds) throw new Error(`Artikel klopt niet meer met de data: "${sentence}". Herschrijf de zin of het artikel.`);
}
