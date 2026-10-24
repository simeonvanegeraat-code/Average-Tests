/**
 * Minimale lezer voor de Eurostat dissemination-API (JSON-stat 2.0).
 *
 *   https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/<code>
 *
 * Geen sleutel nodig en geen dependency. JSON-stat legt alle waarden plat in één
 * object, geïndexeerd op de dimensies in de volgorde van `id`. Deze lezer rekent
 * die index uit, zodat de rest van de pipeline in dimensies kan praten
 * ({ geo: 'NL', time: '2025' }) in plaats van in positienummers.
 *
 * Bewust niet generiek gemaakt tot een volledige JSON-stat-implementatie: we
 * gebruiken één endpoint met één antwoordvorm, en alles wat we niet nodig hebben
 * is code die stil kan verouderen.
 */

export const API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
export const RAW_DIR = new URL('../../data/raw/eurostat/', import.meta.url);

const USER_AGENT = 'humanaverage/1.0 (data pipeline)';

/**
 * Aggregaten staan in dezelfde geo-dimensie als landen, maar zijn geen land.
 *
 * Een vaste lijst bleek te smal: `ilc_lvph01` gebruikt `EU` en `EA18`, die er niet
 * in stonden, en die kwamen daardoor als "land" in de ranglijst terecht — met namen
 * als "European Union (EU6-1958, …)" erbij. Daarom nu een patroon: geen enkele
 * landcode van Eurostat begint met EU of EA (EE, EL, ES wel, maar die matchen niet).
 */
const AGGREGATE_PATTERN = /^(EU|EA)\d*(_\d+)?$/;

export const AGGREGATES = {
  has: (code) => AGGREGATE_PATTERN.test(code) || code === 'EU27_2020' || code === 'EU27_2007',
};

export function datasetUrl(code, params = {}) {
  const query = new URLSearchParams({ format: 'JSON', lang: 'en', ...params });
  return `${API}/${code}?${query}`;
}

export async function fetchDataset(code, params = {}) {
  const url = datasetUrl(code, params);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

  if (!res.ok) {
    throw new Error(
      `Eurostat gaf HTTP ${res.status} voor ${code}.\n` +
      `  ${url}\n` +
      'Een 404 betekent bijna altijd dat de datasetcode is vervangen. Zoek hem op in ' +
      'de catalogus (toc.txt) voordat je hem hier aanpast; schrijf geen code uit je hoofd.',
    );
  }

  return { url, json: await res.json() };
}

/**
 * Maakt een opzoeker over een JSON-stat-antwoord.
 *
 * `at()` geeft `undefined` als er geen waarde is. Dat is de normale toestand en
 * geen fout: niet elk land levert elk jaar aan, en een paar landen stoppen
 * halverwege de reeks (het VK na 2019).
 */
export function reader(json) {
  const dims = json.id;
  const size = json.size;

  if (!Array.isArray(dims) || !Array.isArray(size) || dims.length !== size.length) {
    throw new Error(
      'Geen geldig JSON-stat-antwoord: `id` en `size` ontbreken of hebben niet dezelfde lengte. ' +
      'Controleer of de API html of een foutpagina heeft teruggegeven in plaats van JSON.',
    );
  }

  // De laatste dimensie ligt aaneengesloten in `value`, de eerste springt het verst.
  const stride = new Array(dims.length);
  stride[dims.length - 1] = 1;
  for (let i = dims.length - 2; i >= 0; i -= 1) stride[i] = stride[i + 1] * size[i + 1];

  const index = {};
  const labels = {};
  for (const dim of dims) {
    const category = json.dimension[dim]?.category;
    if (!category?.index) throw new Error(`Dimensie ${dim} heeft geen categorie-index.`);
    index[dim] = category.index;
    labels[dim] = category.label ?? {};
  }

  const values = json.value ?? {};
  const statuses = json.status ?? {};

  /** Platte index, of null als een gevraagde categorie niet bestaat. */
  function flatten(selection) {
    let at = 0;
    for (let i = 0; i < dims.length; i += 1) {
      const dim = dims[i];
      const key = selection[dim];
      if (key === undefined) throw new Error(`Geen keuze opgegeven voor dimensie ${dim}.`);
      const position = index[dim][key];
      if (position === undefined) return null;
      at += position * stride[i];
    }
    return at;
  }

  return {
    label: json.label,
    /** Eurostats eigen updatestempel; de enige betrouwbare "stand van zaken". */
    updated: json.updated,
    dimensions: dims,
    categories: (dim) => Object.keys(index[dim]),
    labelOf: (dim, key) => labels[dim][key] ?? key,
    at(selection) {
      const flat = flatten(selection);
      return flat === null ? undefined : values[flat];
    },
    /** Eurostat-vlag bij een waarde, bijvoorbeeld 'p' voor voorlopig of 'b' voor breuk. */
    statusAt(selection) {
      const flat = flatten(selection);
      return flat === null ? undefined : statuses[flat];
    },
  };
}
