/**
 * De voordeur: de levenslijn, je land in tien rangen, en drie feiten.
 *
 * Gebouwd op 20 november 2026, op Simeons oordeel dat de oude voordeur "niet logisch" was
 * en niet uitnodigde om te klikken. Het plan staat in research/next-round-plan.md §2.
 *
 * Alleen op de server: dit leest tien databestanden. Wat de browser krijgt is per land
 * kant-en-klare tekst en posities; die rekent niets na en kent geen grammatica. Dezelfde
 * regel als home-countries.js: een tweede rekenpad kan van het eerste afwijken.
 *
 * DRIE REGELS DIE HIER IN DE CODE ZITTEN
 *
 *  1. Een rang telt alleen landen die op het laatste jaar staan (les 4 uit CLAUDE.md). Een
 *     land met een ouder cijfer krijgt zijn waarde met het jaar erbij, en geen rang.
 *  2. Aggregaten (EU, eurozone) staan nooit in een landenlijst (les 3).
 *  3. De levenslijn zet vier verschillende metingen op één as: een middelpunt (het huis
 *     uit), een gemiddelde (eerste kind), een leeftijd bij het eerste pensioen, en een
 *     verwachting bij geboorte (gezonde jaren). De pagina zegt dat onder de lijn.
 */
import { formatValue, currentCountries, euAggregate } from './metric.js';
import { euro } from './wealth.js';
import { localise } from './country-names.js';
import { localiseMetric } from './metric-names.js';
import { withArticle, ordinal } from './grammar.js';
import { ui, fill } from './ui.js';
import { linkTo, DEFAULT_LOCALE } from './locales.js';
import { STAGES } from './hue.js';

import leavingHome from './metrics/leaving-home.js';
import householdSize from './metrics/household-size.js';
import dwellingSize from './metrics/dwelling-size.js';
import workingLife from './metrics/working-life.js';
import workingHours from './metrics/working-hours.js';
import unemployment from './metrics/unemployment.js';
import pensionAge from './metrics/pension-age.js';
import healthyYears from './metrics/healthy-years.js';
import firstChild from './metrics/first-child.js';

import leavingHomeData from '../../data/leaving-home/index.json';
import householdSizeData from '../../data/household-size/index.json';
import dwellingSizeData from '../../data/dwelling-size/index.json';
import workingLifeData from '../../data/working-life/index.json';
import workingHoursData from '../../data/working-hours/index.json';
import unemploymentData from '../../data/unemployment/index.json';
import pensionAgeData from '../../data/pension-age/index.json';
import healthyYearsData from '../../data/healthy-years/index.json';
import firstChildData from '../../data/first-child/index.json';
import wealthData from '../../data/wealth/index.json';

/** De metrieken per levensfase, in de volgorde van een leven. */
const PHASES = [
  { key: 'home', metrics: [[leavingHome, leavingHomeData], [householdSize, householdSizeData], [dwellingSize, dwellingSizeData]] },
  { key: 'work', metrics: [[workingLife, workingLifeData], [workingHours, workingHoursData], [unemployment, unemploymentData], [pensionAge, pensionAgeData]] },
  { key: 'family', metrics: [[firstChild, firstChildData], [healthyYears, healthyYearsData]] },
  { key: 'money', metrics: [['wealth', wealthData]] },
];

/** De vier stops op de levenslijn: allemaal een leeftijd, voor 28 landen alle vier. */
const STOPS = [
  [leavingHome, leavingHomeData],
  [firstChild, firstChildData],
  [pensionAge, pensionAgeData],
  [healthyYears, healthyYearsData],
];

/**
 * De volgorde waarin een land de vier momenten leeft: op leeftijd, en een stop zonder
 * cijfer achteraan. De figuurtjes op de voordeur staan in deze volgorde, en wisselen van
 * plek als een land een andere volgorde heeft dan de EU (21 november 2026).
 */
const orderOf = (stops) =>
  [...stops]
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (a.s.age ?? Infinity) - (b.s.age ?? Infinity) || a.i - b.i)
    .map(({ s }) => s.key);

/**
 * Wat er aan die volgorde opvalt, in één zin. Twee wissels komen in de data voor: gezonde
 * jaren vóór het pensioen (7 van de 28 landen) en het eerste kind vóór het huis uit (4).
 * Die tweede zet twee verschillende metingen naast elkaar, een gemiddelde voor moeders en
 * een middelpunt voor alle jongeren, en de zin zegt dat; anders leest hij als "ze krijgen
 * kinderen terwijl ze nog thuis wonen", en dat zegt de data niet.
 */
function storyOf(stopsFor, where, lang) {
  const t = ui(lang).home;
  const age = Object.fromEntries(stopsFor.map((s) => [s.key, s.age]));
  const text = Object.fromEntries(stopsFor.map((s) => [s.key, s.value]));
  const Where = where.charAt(0).toUpperCase() + where.slice(1);
  if (Object.values(age).some((a) => a == null)) return fill(t.storyMissing, { Where });
  const lines = [];
  if (age['healthy-years'] < age['pension-age']) {
    lines.push(fill(t.storyHealthFirst, {
      where,
      health: text['healthy-years'],
      pension: text['pension-age'],
      years: formatValue(age['pension-age'] - age['healthy-years'], { decimals: 1, locale: lang }),
    }));
  }
  if (age['first-child'] < age['leaving-home']) {
    lines.push(fill(t.storyChildFirst, { where, child: text['first-child'], leave: text['leaving-home'] }));
  }
  return lines.length ? lines.join(' ') : fill(t.storySameOrder, { Where });
}

/** Eurostat schrijft Griekenland als EL, de ECB als GR. */
const canonical = (code) => (code === 'GR' ? 'EL' : code);

/**
 * Eén metriek in een vorm die voor alle tien gelijk is: per land waarde, jaar en rang.
 * Vermogen heeft een andere vorm (area, median, period) en wordt hier gelijkgetrokken.
 */
function table(metric, data, lang) {
  if (metric === 'wealth') {
    const named = localise(data, lang);
    const rows = named.countries
      .filter((c) => typeof c.median === 'number')
      .map((c) => ({ code: canonical(c.area), name: c.name, value: c.median, period: c.period }));
    /**
     * De ECB-landen hebben niet allemaal hetzelfde laatste kwartaal (Nederland stopt in
     * deze download een kwartaal eerder). De vermogenspagina's rangschikken toch over alle
     * 21, en de voordeur doet hetzelfde, zodat een rang hier gelijk is aan die daar.
     */
    const sorted = [...rows].sort((a, b) => a.value - b.value);
    return {
      key: 'wealth',
      label: ui(lang).home.wealthLabel,
      path: '/wealth/',
      hue: STAGES.money,
      format: (v) => euro(v, { compact: true, locale: lang }),
      unit: ui(lang).home.wealthUnit,
      eu: { value: named.euroArea.median, text: euro(named.euroArea.median, { compact: true, locale: lang }) },
      euLabel: ui(lang).home.euroArea,
      rows: new Map(sorted.map((r, i) => [r.code, { ...r, place: i + 1, of: sorted.length, ranked: true, path: `/wealth/${r.code === 'EL' ? 'gr' : r.code.toLowerCase()}/` }])),
      low: sorted[0],
      high: sorted.at(-1),
      year: named.euroArea.period,
    };
  }

  const m = localiseMetric(metric, lang);
  const named = localise(data, lang);
  const current = currentCountries(named).sort((a, b) => a.total - b.total);
  const rank = new Map(current.map((c, i) => [c.code, i + 1]));
  const eu = euAggregate(named);
  const format = (v) => formatValue(v, { ...m, locale: lang });
  return {
    key: m.key,
    label: m.label,
    path: m.path,
    hue: m.hue,
    words: m.words,
    format,
    unit: m.unitShort ?? m.unit,
    eu: eu ? { value: eu.total, text: format(eu.total) } : null,
    euLabel: ui(lang).home.eu,
    rows: new Map(
      named.countries.map((c) => [
        canonical(c.code),
        { code: canonical(c.code), name: c.name, value: c.total, year: c.year, ranked: rank.has(c.code), place: rank.get(c.code) ?? null, of: current.length },
      ]),
    ),
    low: current[0] ? { ...current[0], value: current[0].total } : null,
    high: current.at(-1) ? { ...current.at(-1), value: current.at(-1).total } : null,
    year: named.latestYear,
  };
}

/**
 * De rang als tekst, geteld vanaf het dichtstbijzijnde uiterste: "7th earliest of 31",
 * "the latest of 31". De woorden per metriek staan in ui.json (home.rankWords), want
 * "3rd most of 28" leest niet, en het Nederlands verbuigt anders.
 */
function rankText(row, key, lang) {
  if (!row?.ranked) return null;
  const t = ui(lang).home;
  const words = t.rankWords[key];
  const fromLow = row.place;
  const fromHigh = row.of - row.place + 1;
  const end = fromLow <= fromHigh ? 'low' : 'high';
  const place = end === 'low' ? fromLow : fromHigh;
  return {
    end,
    place,
    text: place === 1 ? fill(t.rankFirst, { word: words[end], of: row.of }) : fill(t.rankNth, { nth: ordinal(place, { lang }), word: words[end], of: row.of }),
  };
}

const perLang = new Map();

export function frontDoor(lang = DEFAULT_LOCALE) {
  if (perLang.has(lang)) return perLang.get(lang);
  const t = ui(lang).home;

  const tables = PHASES.map((phase) => ({ key: phase.key, label: t.phases[phase.key], tables: phase.metrics.map(([m, d]) => table(m, d, lang)) }));
  const all = tables.flatMap((p) => p.tables);
  const stops = STOPS.map(([m, d]) => all.find((x) => x.key === m.key) ?? table(m, d, lang));

  /** Elk land dat in minstens één tabel staat, op naam in de taal van de pagina. */
  const names = new Map();
  for (const x of all) for (const r of x.rows.values()) if (!names.has(r.code)) names.set(r.code, r.name);
  const codes = [...names.keys()].sort((a, b) => names.get(a).localeCompare(names.get(b), lang));

  /** Het Europese beeld, zoals de server het schrijft. */
  const europe = {
    stops: stops.map((s) => ({ key: s.key, label: t.stops[s.key], path: linkTo(s.path, lang), hue: s.hue, value: s.eu?.text ?? '—', age: s.eu?.value ?? null })),
    phases: tables.map((p) => ({
      key: p.key,
      label: p.label,
      rows: p.tables.map((x) => ({
        key: x.key,
        label: x.label,
        path: linkTo(x.path, lang),
        hue: x.hue,
        value: x.eu?.text ?? '—',
        unit: x.unit,
        note: x.low && x.high ? fill(t.range, { low: x.low.name, lowValue: x.format(x.low.value), high: x.high.name, highValue: x.format(x.high.value) }) : '',
        who: x.euLabel,
      })),
    })),
    facts: europeFacts(all, lang),
  };
  europe.order = orderOf(europe.stops);
  europe.story = t.storyEurope;

  /** Per land: dezelfde vorm, met de rang in plaats van de spreiding. */
  const countries = {};
  for (const code of codes) {
    const name = names.get(code);
    const where = withArticle(name, { lang });
    const stopsFor = stops.map((s) => {
      const row = s.rows.get(code);
      const eu = s.eu?.value;
      const diff = row && eu != null ? row.value - eu : null;
      /** "later" en "earlier", maar bij gezonde jaren "more" en "fewer": de woorden van de metriek. */
      const words = s.words ?? {};
      return {
        key: s.key,
        value: row ? s.format(row.value) : '—',
        age: row ? row.value : null,
        year: row && !row.ranked ? row.year : null,
        diff: diff === null ? '' : Math.abs(diff) < 0.05 ? t.sameAsEu : fill(t.comparedWithEu, { years: formatValue(Math.abs(diff), { decimals: 1, locale: lang }), word: diff > 0 ? words.above : words.below }),
      };
    });
    const ranks = [];
    const phases = tables.map((p) => ({
      key: p.key,
      rows: p.tables.map((x) => {
        const row = x.rows.get(code);
        const r = rankText(row, x.key, lang);
        if (r) ranks.push({ key: x.key, label: x.label, path: x.path, value: x.format(row.value), unit: x.unit, ...r });
        return {
          key: x.key,
          value: row ? x.format(row.value) : '—',
          note: r ? r.text : row ? fill(t.notRanked, { year: row.year ?? row.period ?? '' }) : t.noFigure,
          path: row?.path ? linkTo(row.path, lang) : linkTo(x.path, lang),
          top: r ? r.place <= 3 : false,
          who: name,
        };
      }),
    }));
    countries[code] = {
      name,
      where,
      stops: stopsFor,
      order: orderOf(stopsFor),
      story: storyOf(stopsFor, where, lang),
      phases,
      facts: countryFacts(ranks, where, lang),
    };
  }

  const result = { europe, countries, codes: codes.map((c) => ({ code: c, name: names.get(c) })), metricCount: all.length, stopCount: stops.length };
  perLang.set(lang, result);
  return result;
}

/**
 * Drie feiten over Europa: de metrieken waarop de landen het verst uit elkaar liggen,
 * gemeten als hoogste gedeeld door laagste. Een verhouding en geen verschil, zodat jaren,
 * personen en euro's tegen elkaar af te wegen zijn.
 */
function europeFacts(all, lang) {
  const t = ui(lang).home;
  return all
    .filter((x) => x.low && x.high && x.low.value > 0)
    .map((x) => ({ x, ratio: x.high.value / x.low.value }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3)
    .map(({ x, ratio }) => ({
      key: x.key,
      label: x.label,
      path: linkTo(x.path, lang),
      hue: x.hue,
      text: fill(t.factEurope, {
        high: withArticle(x.high.name, { lang, capitalise: true }),
        highValue: `${x.format(x.high.value)}${x.unit ? ` ${x.unit}` : ''}`,
        low: withArticle(x.low.name, { lang }),
        lowValue: `${x.format(x.low.value)}${x.unit ? ` ${x.unit}` : ''}`,
        ratio: formatValue(ratio, { decimals: 1, locale: lang }),
      }),
    }));
}

/** Drie feiten over een land: de rangen het dichtst bij een uiterste. */
function countryFacts(ranks, where, lang) {
  const t = ui(lang).home;
  return [...ranks]
    .sort((a, b) => a.place - b.place || a.key.localeCompare(b.key))
    .slice(0, 3)
    .map((r) => ({
      key: r.key,
      label: r.label,
      path: linkTo(r.path, lang),
      text: fill(t.factCountry, { value: `${r.value}${r.unit ? ` ${r.unit}` : ''}`, rank: r.text }),
    }));
}
