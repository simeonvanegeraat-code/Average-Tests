/**
 * Alles wat de pagina /dwelling-size/ uitrekent, los van de taal waarin hij het
 * verwoordt.
 *
 * Zevende pagina in de vorm van 3 november 2026: één plek rekent, twee plekken
 * verwoorden. `src/lib/pages/leaving-home.js` legt uit waarom die scheiding er is.
 *
 * Deze pagina heeft iets dat geen andere heeft: de deling door de huishoudgrootte.
 * Vierkante meters per woning en per persoon geven een andere rangorde, en dat is het
 * antwoord op een vraag die een tabel met woninggroottes niet beantwoordt. De rekensom
 * staat in `src/lib/space-per-person.js`, met de beperking erbij: het is één gepubliceerd
 * gemiddelde gedeeld door een ander.
 */
import { localise } from '../country-names.js';
import { localiseMetric } from '../metric-names.js';
import { decimal, upTo } from '../format.js';
import {
  currentCountries,
  formatAmount,
  formatValue,
  headline,
  ranked,
  staleCountries,
} from '../metric.js';
import { spacePerPerson } from '../space-per-person.js';
import baseMetric from '../metrics/dwelling-size.js';
import baseHouseholdMetric from '../metrics/household-size.js';
import rawIndex from '../../../data/dwelling-size/index.json';
import rawHouseholdData from '../../../data/household-size/index.json';

/** De zes grote economieën die de alinea over rijkdom noemt. */
const BIG = ['DE', 'FR', 'IT', 'ES', 'PL', 'NL'];

export function dwellingSizePage(lang) {
  const index = localise(rawIndex, lang);
  const householdData = localise(rawHouseholdData, lang);
  const metric = { ...localiseMetric(baseMetric, lang), locale: lang };
  const householdMetric = { ...localiseMetric(baseHouseholdMetric, lang), locale: lang };

  const h = headline(index);
  const stale = staleCountries(index);
  const order = ranked(index);
  const current = currentCountries(index);
  const space = spacePerPerson(index, householdData);

  /** Opmaak in de taal van deze pagina: beide metrieken dragen hun locale. */
  const fmt = (value) => formatValue(value, metric);
  const amt = (value, options = {}) => formatAmount(value, metric, options);
  const people = (value) => formatAmount(value, householdMetric);
  const peopleValue = (value) => formatValue(value, householdMetric);

  const names = (list) => list.map((country) => country.name).join(', ');

  const clientJson = JSON.stringify({
    decimals: metric.decimals,
    unit: metric.unit,
    unitOne: metric.unitOne,
    /**
     * Een halve vierkante meter is geen verschil, een halve komma-eenheid wel. Deze
     * drempel hoort bij de metriek en niet bij het onderdeel dat de zin zet: zie
     * `src/lib/metrics/dwelling-size.js`.
     */
    exactWithin: metric.exactWithin,
    locale: lang,
    words: metric.words,
    countries: current.map(({ code, name, total }) => ({ code, name, total })),
  }).replace(/</g, '\\u003c');

  return {
    index,
    householdData,
    metric,
    householdMetric,
    h,
    stale,
    space,
    /**
     * De twee verhoudingen komen als getal uit space-per-person.js en gingen zo de
     * pagina in, dus met een punt — ook op /nl/. upTo() laat nullen achteraan weg, want
     * er stond "2.7" en niet "2.70".
     */
    ratioArea: space ? upTo(space.ratioArea, 2, { locale: lang }) : null,
    ratioPerson: space ? upTo(space.ratioPerson, 2, { locale: lang }) : null,
    fmt,
    amt,
    people,
    peopleValue,
    euValue: h.eu ? fmt(h.eu.total) : fmt(order[Math.floor(order.length / 2)].total),
    ratio: decimal(h.latest.total / h.earliest.total, 2, { locale: lang }),
    small5: names(order.slice(0, 5)),
    large5: names(order.slice(-5).reverse()),
    bigOnes: current
      .filter((country) => BIG.includes(country.code))
      .sort((a, b) => a.total - b.total)
      .map((country) => `${country.name} ${fmt(country.total)}`)
      .join(', '),
    /** De landen die het meest van plaats veranderen zodra je door de huishoudgrootte deelt. */
    movers: space
      ? [...space.byArea]
          .sort((a, b) => Math.abs(b.areaRank - b.personRank) - Math.abs(a.areaRank - a.personRank))
          .slice(0, 3)
      : [],
    clientJson,
  };
}
