/**
 * De landenkiezer op de voordeur: per land één cijfer per metriek, kant-en-klaar.
 *
 * De homepage toont negen kaarten met het Europese cijfer. Kiest een bezoeker zijn
 * land, dan schrijven die kaarten zichzelf om naar dat land. Dit bestand levert wat
 * daarvoor nodig is, en rekent dat op de server uit — net als src/lib/catalogue.js,
 * dat de kaarten zelf levert.
 *
 * **Alles komt hier al opgemaakt uit.** De client krijgt "23.4", niet 23.4 met de
 * opdracht het zelf af te ronden. Dat is dezelfde reden die in metric.js staat: een
 * tweede rekenpad is een pad dat van het eerste kan afwijken. De browser verzet hier
 * alleen tekst.
 *
 * Alleen op de server: dit importeert tien JSON-bestanden.
 *
 * Drie dingen die onderweg bleken, en waarom de code eruitziet zoals hij eruitziet:
 *
 * 1. **Vermogen heeft een andere vorm.** De ECB-pijplijn schrijft `area` en `median`
 *    waar de Eurostat-pijplijn `code` en `total` schrijft. Daarom heeft catalogue.js
 *    een aparte `wealthEntry()`, en daarom staat vermogen hieronder apart.
 * 2. **Griekenland staat er twee keer in.** Eurostat schrijft `EL`, de ECB `GR`.
 *    Zonder samenvoegen staat Griekenland twee keer in de lijst, met in elke regel
 *    de helft van de cijfers.
 * 3. **Geen enkel land heeft alle negen vanzelf.** Achttien wel, tien missen er één
 *    (meestal vermogen, want de ECB dekt alleen de eurozone), en een handvol landen
 *    heeft er maar een paar. Een land met drie cijfers toont er drie; de kaarten
 *    zonder cijfer blijven staan en zeggen dat ze leeg zijn. Weglaten zou de pagina
 *    laten verspringen en zou verzwijgen wat er niet is.
 */
import { currentCountries, formatValue } from './metric.js';
import { euro } from './wealth.js';
import { catalogue } from './catalogue.js';
import { DEFAULT_LOCALE } from './locales.js';
import { localise } from './country-names.js';

import leavingHome from './metrics/leaving-home.js';
import householdSize from './metrics/household-size.js';
import dwellingSize from './metrics/dwelling-size.js';
import workingLife from './metrics/working-life.js';
import workingHours from './metrics/working-hours.js';
import pensionAge from './metrics/pension-age.js';
import unemployment from './metrics/unemployment.js';
import healthyYears from './metrics/healthy-years.js';
import firstChild from './metrics/first-child.js';

import leavingHomeData from '../../data/leaving-home/index.json';
import householdSizeData from '../../data/household-size/index.json';
import dwellingSizeData from '../../data/dwelling-size/index.json';
import workingLifeData from '../../data/working-life/index.json';
import workingHoursData from '../../data/working-hours/index.json';
import pensionAgeData from '../../data/pension-age/index.json';
import unemploymentData from '../../data/unemployment/index.json';
import healthyYearsData from '../../data/healthy-years/index.json';
import firstChildData from '../../data/first-child/index.json';
import wealthData from '../../data/wealth/index.json';

/** De Eurostat-metrieken, in de volgorde van de catalogus. */
const EUROSTAT = [
  [leavingHome, leavingHomeData],
  [householdSize, householdSizeData],
  [dwellingSize, dwellingSizeData],
  [workingLife, workingLifeData],
  [workingHours, workingHoursData],
  [unemployment, unemploymentData],
  [pensionAge, pensionAgeData],
  [healthyYears, healthyYearsData],
  [firstChild, firstChildData],
];

/** Codes die hetzelfde land zijn. Links wat de bron schrijft, rechts wat wij aanhouden. */
const SAME_COUNTRY = new Map([['GR', 'EL']]);

const canonical = (code) => SAME_COUNTRY.get(code) ?? code;

/**
 * Waar een waarde ligt tussen het laagste en het hoogste land, als percentage.
 *
 * Dat is wat het balkje op een kaart toont. `spread()` in metric.js doet hetzelfde
 * voor het Europese cijfer; hier is het per land, en daarom staat de rekensom hier
 * en niet daar.
 */
function position(value, low, high) {
  const distance = high - low;
  if (!Number.isFinite(distance) || distance <= 0) return null;
  return Math.min(100, Math.max(0, ((value - low) / distance) * 100));
}

/**
 * Dit stond op moduleniveau: drie `export const` die bij het importeren werden
 * berekend. Een landenlijst die bij import ontstaat draagt de namen van één taal en
 * wordt daarna door elke pagina gedeeld — dus zou de voordeur Engelse landnamen
 * houden op /nl/. Zie dezelfde omzetting in catalogue.js.
 *
 * De sortering staat hier ook niet voor niets: `localeCompare(a, b, lang)` zet
 * IJsland en Oostenrijk anders dan het Engels dat doet, en een landenlijst die op
 * zijn Engelse naam gesorteerd is leest in het Nederlands als een willekeurige rij.
 */
const perLang = new Map();

function build(lang) {
  const byCode = new Map();

  const remember = (code, name) => {
    const key = canonical(code);
    if (!key) return null;
    if (!byCode.has(key)) byCode.set(key, { code: key, name, values: {} });
    return byCode.get(key);
  };

  for (const [metric, index] of EUROSTAT) {
    const cfg = { ...metric, locale: lang };
    const current = currentCountries(localise(index, lang));
    const totals = current.map((country) => country.total);
    const low = Math.min(...totals);
    const high = Math.max(...totals);

    for (const country of current) {
      const entry = remember(country.code, country.name);
      if (!entry) continue;
      entry.values[metric.key] = {
        v: formatValue(country.total, cfg),
        at: position(country.total, low, high),
      };
    }
  }

  // Vermogen apart, om de reden in de kop van dit bestand.
  {
    const named = localise(wealthData, lang);
    const withMedian = named.countries.filter((country) => typeof country.median === 'number');
    const medians = withMedian.map((country) => country.median);
    const low = Math.min(...medians);
    const high = Math.max(...medians);

    for (const country of withMedian) {
      const entry = remember(country.area, country.name);
      if (!entry) continue;
      entry.values.wealth = {
        v: euro(country.median, { compact: true, locale: lang }),
        at: position(country.median, low, high),
        /**
         * Vermogen is de enige metriek die al een pagina per land heeft. Zonder
         * taalvoorvoegsel, net als `path` in catalogue.js: de pagina zet het ervoor.
         * Let op de valkuil hier — voor Nederland is dit `/wealth/nl/`, en met een
         * voorvoegsel erop `/nl/wealth/nl/`. Twee keer "nl" die niets met elkaar te
         * maken hebben.
         */
        path: `/wealth/${country.area.toLowerCase()}/`,
      };
    }
  }

  const countries = [...byCode.values()]
    .map((country) => ({ ...country, have: Object.keys(country.values).length }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  return {
    /** Elk land dat in minstens één dataset staat, op naam. */
    countries,
    /** Hoeveel metrieken de voordeur toont; de noemer in "4 of the 9 figures". */
    metricCount: catalogue(lang).length,
    /**
     * Wat de browser krijgt. Klein gehouden: alleen naam, cijfers en balkposities, en
     * de balkpositie op één decimaal. Gemeten op 40 landen is dit een paar kilobyte.
     */
    countryData: Object.fromEntries(
      countries.map((country) => [
        country.code,
        {
          n: country.name,
          have: country.have,
          m: Object.fromEntries(
            Object.entries(country.values).map(([key, cell]) => [
              key,
              { v: cell.v, at: cell.at === null ? null : Number(cell.at.toFixed(1)), ...(cell.path ? { p: cell.path } : {}) },
            ]),
          ),
        },
      ]),
    ),
  };
}

export function homeCountries(lang = DEFAULT_LOCALE) {
  let found = perLang.get(lang);
  if (!found) {
    found = build(lang);
    perLang.set(lang, found);
  }
  return found;
}
