/**
 * Lezer voor de SDMX-JSON van de OECD.
 *
 * Een ander formaat dan de JSON-stat van Eurostat, dus een eigen lezer. De vorm:
 *
 *   data.structure.dimensions.series      de reeksdimensies, elk met values[]
 *   data.structure.dimensions.observation de tijdas
 *   data.dataSets[0].series               sleutel "0:0:3:0:1:0:0" -> { observations }
 *
 * De sleutel is een dubbelepunt-lijst van posities in die values-arrays, in dezelfde
 * volgorde als `dimensions.series`. De observations zijn gesleuteld op positie in de
 * tijdas en hun waarde is een array waarvan het eerste element het getal is.
 *
 * Geen dependencies, net als de rest van de pijplijn.
 */

export const BASE = 'https://sdmx.oecd.org/public/rest/data';

/** Bouwt de URL voor één maat over alle landen en alle jaren. */
export function dataUrl({ dataflow, key }) {
  return `${BASE}/${dataflow}/${key}?format=jsondata`;
}

export async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/vnd.sdmx.data+json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} bij ${url}`);
  return response.json();
}

/** De inhoud van `data`, want de OECD verpakt alles één laag diep. */
const body = (json) => json.data ?? json;

/**
 * Leest de SDMX-JSON uit tot platte waarnemingen.
 *
 * Geeft `{ dims, times, rows }`, waarbij elke rij een object is met per dimensie de
 * code, per observatie-attribuut zijn waarde (`OBS_STATUS` vooral) en `time` en `value`. Daarmee is de rest van de pijplijn gewone JavaScript
 * in plaats van gepuzzel met posities.
 */
export function readObservations(json) {
  const root = body(json);
  const series = root.structure?.dimensions?.series ?? [];
  const timeDim = root.structure?.dimensions?.observation?.[0];
  const times = (timeDim?.values ?? []).map((value) => value.id);
  const dataSet = (root.dataSets ?? [])[0];

  if (!series.length || !dataSet?.series) return { dims: [], times, rows: [] };

  const dims = series.map((dim) => dim.id);
  const obsAttributes = root.structure?.attributes?.observation ?? [];
  const rows = [];

  for (const [key, entry] of Object.entries(dataSet.series)) {
    const positions = key.split(':').map(Number);
    const labels = {};
    series.forEach((dim, i) => {
      labels[dim.id] = dim.values[positions[i]]?.id ?? null;
      labels[`${dim.id}_name`] = dim.values[positions[i]]?.name ?? null;
    });

    for (const [timeIndex, observation] of Object.entries(entry.observations ?? {})) {
      const value = Array.isArray(observation) ? observation[0] : observation;
      if (typeof value !== 'number') continue;

      // De attributen staan achter de waarde, in de volgorde van structure.attributes.observation.
      const attributes = {};
      obsAttributes.forEach((attribute, i) => {
        attributes[attribute.id] = attribute.values?.[observation?.[i + 1]]?.id ?? null;
      });

      rows.push({ ...labels, ...attributes, time: times[Number(timeIndex)], value });
    }
  }

  return { dims, times, rows };
}

/**
 * Landcodes die geen land zijn. De OECD mengt aggregaten tussen de gebieden, net als
 * Eurostat dat doet met EU27 en de eurozone — en daar ging het eerder mis.
 */
const AGGREGATES = new Set([
  'OECD', 'OECDE', 'EU27_2020', 'EA19', 'EA20', 'G7', 'G20', 'WLD', 'EU', 'OAVG', 'EU27',
]);

export const isCountry = (code) => typeof code === 'string' && code.length === 3 && !AGGREGATES.has(code);

/**
 * Per gebied de hele reeks per geslacht, plus de laatste jaargang waarin **beide**
 * geslachten een cijfer hebben.
 *
 * Elk gebied draagt zo zijn eigen jaar, zoals overal op deze site, maar mannen en
 * vrouwen binnen een gebied komen altijd uit hetzelfde jaar. Argentinie maakte dat
 * concreet: vrouwen lopen door tot 2024, mannen stoppen in 2023, en een verschil
 * over twee jaargangen is geen verschil. Het kost Argentinie een jaar actualiteit
 * en levert een cijfer op dat je mag aftrekken.
 *
 * `include` kiest welke gebieden meedoen, zodat landen en aggregaten door dezelfde
 * code gaan en niet per ongeluk in dezelfde lijst belanden.
 */
export function pairSeries(rows, { include = isCountry, men = 'M', women = 'F' } = {}) {
  const perArea = new Map();

  for (const row of rows) {
    if (!include(row.REF_AREA)) continue;
    if (row.SEX !== men && row.SEX !== women) continue;
    if (row.OBS_STATUS !== 'A') {
      throw new Error(`${row.REF_AREA} ${row.time} heeft status ${row.OBS_STATUS}, niet A. Bekijk de reeks voordat dit gepubliceerd wordt.`);
    }

    if (!perArea.has(row.REF_AREA)) {
      perArea.set(row.REF_AREA, { name: row.REF_AREA_name, men: {}, women: {} });
    }
    perArea.get(row.REF_AREA)[row.SEX === men ? 'men' : 'women'][row.time] = row.value;
  }

  const out = [];
  for (const [code, area] of perArea) {
    const beide = Object.keys(area.men)
      .filter((year) => typeof area.women[year] === 'number')
      .sort((a, b) => Number(b) - Number(a));
    if (!beide.length) continue;

    const year = beide[0];
    out.push({
      code,
      name: area.name,
      year,
      men: area.men[year],
      women: area.women[year],
      series: { men: area.men, women: area.women },
    });
  }

  return out.sort((a, b) => a.men - b.men);
}
