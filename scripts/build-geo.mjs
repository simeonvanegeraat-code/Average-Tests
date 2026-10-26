/**
 * Bouwt data/geo/europe.json: de Europakaart als voorgeprojecteerde SVG-paden.
 *
 *   node scripts/build-geo.mjs
 *
 * Waarom voorgeprojecteerd: de site tekent de kaart als statische SVG, zonder
 * kaartbibliotheek in de browser. Projecteren, vereenvoudigen en labelpunten bepalen
 * gebeurt daarom één keer, hier. De pagina krijgt alleen een viewBox en per land een
 * pad (`d`), een labelpunt en een vlag voor achtergrondlanden.
 *
 * ── Gegevens voor data/sources.md ────────────────────────────────────────────────
 *
 * Bron          Natural Earth, "Admin 0 – Countries", schaal 1:50m (medium), versie
 *               4.1.0. Publiek domein, commercieel gebruik toegestaan, bronvermelding
 *               niet nodig (https://www.naturalearthdata.com/about/terms-of-use/).
 *               Origineel: ne_50m_admin_0_countries.zip
 *               (https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip)
 *
 * Verspreid als TopoJSON door het npm-pakket world-atlas 2.0.2 (Mike Bostock, ISC),
 *               dat versie 4.1.0 van Natural Earth herverdeelt. Dat is het bestand dat
 *               we ophalen, vastgepind op versie én op checksum:
 *                 URL      https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json
 *                 Bestand  countries-50m.json, 756.420 bytes
 *                 SHA-256  04342cdc1e3016bcd7db1630de95684d67b79fe3c8c460321e87aef469502394
 *               Het bestand is niet geprojecteerd (graden), gekwantiseerd (-q 1e5, dus
 *               een rasterstap van 0,0036 graden in lengte) en door world-atlas niet
 *               verder vereenvoudigd; zie het prepublish-script van tag v2.0.2.
 *
 * Projectie     Lambert azimutale equal-area, middelpunt 10°E 52°N, op de eenheidsbol,
 *               met y gespiegeld zodat noord boven ligt. Equal-area zodat oppervlakten
 *               eerlijk zijn; azimutaal zodat Europa niet scheef staat zoals in
 *               Mercator of een platte lengte/breedte-kaart.
 *
 * Kader         De viewBox is 1000 eenheden breed; de hoogte volgt uit het kader
 *               (nu 855). Het kader is de omhullende van de landen in FRAME_CODES,
 *               plus 1,5% marge. Alles daarbuiten (het grootste deel van Rusland,
 *               Noord-Afrika, Iran) wordt niet geknipt maar door de viewBox afgesneden.
 *
 * Vereenvoudiging  Ramer–Douglas–Peucker per TopoJSON-arc, met tolerantie ε = 0,55
 *               viewBox-eenheden voor datalanden en 1,1 voor achtergrondlanden. Eén
 *               eenheid is 0,1% van de kaartbreedte. Landen delen arcs, dus gedeelde
 *               grenzen blijven op elkaar aansluiten; alleen tussen een datalanden en
 *               een achtergrondland gebruiken beide kanten een andere tolerantie, met
 *               een verschil van hooguit 0,55 eenheid, onder de streekdikte van de kaart.
 *               Coördinaten zijn afgerond op 0,1 eenheid.
 *
 * Labelpunt     Middelpunt van de grootste ingeschreven cirkel (polylabel, precisie 0,6)
 *               in het grootste polygoon van het land; `lr` is de straal. Zo valt een
 *               waardelabel ook bij Noorwegen of Italië binnen de vorm.
 *
 * ── Uitvoer ──────────────────────────────────────────────────────────────────────
 *
 *   { w, h, countries: { <code>: { ctx, name, d, lx, ly, lr, area } } }
 *
 *   code   Eurostat-landcode (EL voor Griekenland, UK voor het Verenigd Koninkrijk);
 *          achtergrondlanden hebben ISO 3166-1 alpha-2, want Eurostat kent ze niet.
 *   ctx    1 = alleen achtergrond (geen Eurostat-waarde), 0 = land in de dataset.
 *   name   Naam zoals Natural Earth die geeft ("Macedonia", "Bosnia and Herz.").
 *          Toon op de site de Eurostat-naam, niet deze.
 *   d      SVG-pad. Gebruik fill-rule="evenodd": enclaves en meren zijn gaten.
 *   area   Oppervlak in eenheden², voor het kiezen van labels en chips.
 *
 * De uitvoer is deterministisch: twee keer draaien geeft hetzelfde bestand. Wie een
 * andere Node-versie gebruikt kan in de laatste decimaal van een enkel punt afwijken,
 * omdat sin/cos per engine licht verschillen mogen; vergelijk dan de paden visueel.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// ── Bron ────────────────────────────────────────────────────────────────────────

const SOURCE = {
  url: 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json',
  name: 'countries-50m.json',
  bytes: 756420,
  sha256: '04342cdc1e3016bcd7db1630de95684d67b79fe3c8c460321e87aef469502394',
};
const RAW_DIR = new URL('../data/raw/geo/', import.meta.url);
const OUT_DIR = new URL('../data/geo/', import.meta.url);

// ── Keuzes, met reden ───────────────────────────────────────────────────────────

const VIEWBOX_WIDTH = 1000;
const CENTER_LON = 10, CENTER_LAT = 52;

// Een polygoon telt alleen mee als het gemiddelde van zijn punten in dit venster ligt.
// Zo vallen overzeese gebieden af (Frans-Guyana, Canarische Eilanden, Madeira,
// Svalbard) zonder dat we polygonen hoeven te knippen. Zou Spanje zijn eilanden voor
// de Canarische Eilanden behouden, dan werd het kader honderden kilometers te groot.
const WINDOW = { lonMin: -25, lonMax: 46, latMin: 33, latMax: 72 };

// De landen die samen de rand van Europa vormen: westen (PT, IE, IS), noorden (NO, FI),
// oosten (TR), zuiden (CY, MT, EL, ES) en het Baltische en Balkan-midden. Het kader
// volgt uit hun uiterste punten, niet uit een met de hand gekozen rechthoek.
const FRAME_CODES = new Set(['IS', 'PT', 'FI', 'NO', 'TR', 'CY', 'MT', 'EL', 'IE', 'ES', 'BG', 'RO', 'LV', 'EE']);
const FRAME_MARGIN = 0.015;

// Tolerantie in viewBox-eenheden. Datalanden krijgen de scherpste vorm omdat daar
// waardelabels en klikdoelen op zitten; achtergrondlanden mogen grover.
const EPS_DATA = 0.55;
const EPS_CONTEXT = 1.1;

// Eilandjes kleiner dan dit verdwijnen (het grootste polygoon van een land blijft altijd).
const MIN_ISLAND_DATA = 0.25;
const MIN_ISLAND_CONTEXT = 1.5;

const LABEL_PRECISION = 0.6;

// Landen waarvoor Eurostat (bijv. yth_demo_030) een waarde kan geven. Alles daarbuiten
// is achtergrond. Eurostat schrijft EL en UK waar ISO GR en GB heeft.
const DATA_CODES = new Set([
  'BE', 'BG', 'CZ', 'DK', 'DE', 'EE', 'IE', 'EL', 'ES', 'FR', 'HR', 'IT', 'CY', 'LV', 'LT',
  'LU', 'HU', 'MT', 'NL', 'AT', 'PL', 'PT', 'RO', 'SI', 'SK', 'FI', 'SE', 'NO', 'UK', 'BA',
  'ME', 'MK', 'RS', 'TR',
]);

// Natural Earth-naam (zoals world-atlas die in properties.name zet) naar code.
// 'N. Cyprus' krijgt dezelfde code als Cyprus: Eurostat rekent het hele eiland tot CY,
// en een kaart met een grijs gat in Cyprus zou dat lezen als ontbrekende data.
const NAME_TO_CODE = {
  Belgium: 'BE', Bulgaria: 'BG', Czechia: 'CZ', Denmark: 'DK', Germany: 'DE', Estonia: 'EE',
  Ireland: 'IE', Greece: 'EL', Spain: 'ES', France: 'FR', Croatia: 'HR', Italy: 'IT',
  Cyprus: 'CY', 'N. Cyprus': 'CY', Latvia: 'LV', Lithuania: 'LT', Luxembourg: 'LU',
  Hungary: 'HU', Malta: 'MT', Netherlands: 'NL', Austria: 'AT', Poland: 'PL', Portugal: 'PT',
  Romania: 'RO', Slovenia: 'SI', Slovakia: 'SK', Finland: 'FI', Sweden: 'SE', Norway: 'NO',
  'United Kingdom': 'UK', 'Bosnia and Herz.': 'BA', Montenegro: 'ME', Macedonia: 'MK',
  Serbia: 'RS', Turkey: 'TR',
  // Achtergrond: zonder deze buren zweeft Europa op een leeg vlak.
  Switzerland: 'CH', Iceland: 'IS', Albania: 'AL', Kosovo: 'XK', Belarus: 'BY', Ukraine: 'UA',
  Moldova: 'MD', Russia: 'RU', Georgia: 'GE', Armenia: 'AM', Azerbaijan: 'AZ',
  Liechtenstein: 'LI', Monaco: 'MC', 'San Marino': 'SM', Vatican: 'VA', Andorra: 'AD',
  Morocco: 'MA', Algeria: 'DZ', Tunisia: 'TN', Syria: 'SY', Lebanon: 'LB', Israel: 'IL',
  Iraq: 'IQ', Iran: 'IR',
};

// ── Bron ophalen en controleren ─────────────────────────────────────────────────

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

async function loadSource() {
  const target = new URL(SOURCE.name, RAW_DIR);

  try {
    const existing = await readFile(target);
    if (sha256(existing) === SOURCE.sha256) {
      console.log(`  ${SOURCE.name} al aanwezig, checksum klopt`);
      return existing;
    }
    console.log(`  ${SOURCE.name} aanwezig maar checksum wijkt af, opnieuw ophalen`);
  } catch {
    // nog niet gedownload
  }

  const res = await fetch(SOURCE.url);
  if (!res.ok) {
    throw new Error(
      `${SOURCE.name}: HTTP ${res.status} bij ${SOURCE.url}\n` +
      'Het pakket world-atlas is vastgepind op 2.0.2; een 404 betekent dat jsDelivr of npm ' +
      'het bestand niet meer serveert. Zoek de TopoJSON op een andere plek en werk SOURCE ' +
      'bij, inclusief checksum en de kop van dit bestand.',
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const digest = sha256(buf);
  if (digest !== SOURCE.sha256 || buf.length !== SOURCE.bytes) {
    throw new Error(
      `${SOURCE.name}: checksum of grootte komt niet overeen.\n` +
      `  verwacht: ${SOURCE.sha256} (${SOURCE.bytes} bytes)\n` +
      `  gekregen: ${digest} (${buf.length} bytes)\n` +
      'De bron is veranderd. Bouw geen kaart uit een bestand dat niet is wat we dachten: ' +
      'bekijk eerst wat er anders is en werk SOURCE en data/sources.md bij.',
    );
  }

  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(target, buf);
  console.log(`  ${SOURCE.name} opgehaald, ${buf.length} bytes, checksum klopt`);
  return buf;
}

// ── Meetkunde ───────────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;
const L0 = CENTER_LON * RAD, P0 = CENTER_LAT * RAD;

/** Lambert azimutale equal-area op de eenheidsbol; y gespiegeld, zodat noord boven ligt. */
function project(lon, lat) {
  const l = lon * RAD, p = lat * RAD;
  const k = Math.sqrt(2 / (1 + Math.sin(P0) * Math.sin(p) + Math.cos(P0) * Math.cos(p) * Math.cos(l - L0)));
  return [
    k * Math.cos(p) * Math.sin(l - L0),
    -k * (Math.cos(P0) * Math.sin(p) - Math.sin(P0) * Math.cos(p) * Math.cos(l - L0)),
  ];
}

/** Ramer–Douglas–Peucker; begin- en eindpunt blijven staan, zodat gedeelde arcs aansluiten. */
function simplify(points, eps) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [s, e] = stack.pop();
    const [x1, y1] = points[s], [x2, y2] = points[e];
    const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
    let dmax = 0, imax = -1;

    for (let i = s + 1; i < e; i++) {
      const [x, y] = points[i];
      let d;
      if (len2 === 0) d = Math.hypot(x - x1, y - y1);
      else {
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
        d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
      }
      if (d > dmax) { dmax = d; imax = i; }
    }
    if (dmax > eps && imax > -1) { keep[imax] = 1; stack.push([s, imax], [imax, e]); }
  }
  return points.filter((_, i) => keep[i]);
}

const ringArea = (ring) => {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(s / 2);
};

/** Kwadraat van de afstand van punt (px,py) tot lijnstuk a-b. */
function distToSegment2(px, py, a, b) {
  let x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = b[0]; y = b[1]; } else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = px - x; dy = py - y;
  return dx * dx + dy * dy;
}

/** Afstand tot de rand van het polygoon; positief binnen, negatief buiten (gaten tellen mee). */
function signedDistance(px, py, rings) {
  let inside = false, min2 = Infinity;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      min2 = Math.min(min2, distToSegment2(px, py, a, b));
    }
  }
  return (inside ? 1 : -1) * Math.sqrt(min2);
}

/**
 * Polylabel (Mapbox): het punt in het polygoon dat het verst van elke rand ligt. Een
 * zwaartepunt valt bij een holle vorm als Noorwegen of Kroatië soms buiten het land.
 */
function polylabel(rings, precision) {
  const outer = rings[0];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of outer) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const w = x1 - x0, h = y1 - y0, cell = Math.min(w, h);
  if (cell === 0) return [x0, y0, 0];

  const make = (x, y, half) => {
    const d = signedDistance(x, y, rings);
    return { x, y, h: half, d, max: d + half * Math.SQRT2 };
  };

  let half = cell / 2;
  const queue = [];
  for (let x = x0; x < x1; x += cell) for (let y = y0; y < y1; y += cell) queue.push(make(x + half, y + half, half));

  let best = make(x0 + w / 2, y0 + h / 2, 0);
  while (queue.length) {
    queue.sort((a, b) => b.max - a.max);
    const c = queue.shift();
    if (c.d > best.d) best = c;
    if (c.max - best.d <= precision) continue;
    half = c.h / 2;
    queue.push(
      make(c.x - half, c.y - half, half), make(c.x + half, c.y - half, half),
      make(c.x - half, c.y + half, half), make(c.x + half, c.y + half, half),
    );
  }
  return [best.x, best.y, best.d];
}

/** SVG-pad: eerste punt absoluut, daarna relatieve stappen van 0,1 eenheid. */
function toPath(rings) {
  return rings.map((ring) => {
    let d = `M${round1(ring[0][0])} ${round1(ring[0][1])}`;
    let px = Math.round(ring[0][0] * 10), py = Math.round(ring[0][1] * 10);
    let first = true;                           // het commando `l` staat alleen voor de eerste stap
    for (let i = 1; i < ring.length; i++) {
      const x = Math.round(ring[i][0] * 10), y = Math.round(ring[i][1] * 10);
      const dx = x - px, dy = y - py;
      if (dx === 0 && dy === 0) continue;       // na afronden samengevallen: overslaan
      // Zonder `l` leest SVG de getallen na `M` als absolute punten. Daarom hangt het
      // commando aan de eerste stap die we echt schrijven, niet aan index 1: die kan
      // wegvallen als het tweede punt na afronden op het eerste ligt.
      d += `${first ? 'l' : ' '}${dx / 10} ${dy / 10}`;
      first = false;
      px = x; py = y;
    }
    return `${d}z`;
  }).join('');
}

const round1 = (n) => (Math.round(n * 10) / 10).toString();

// ── Bouwen ──────────────────────────────────────────────────────────────────────

console.log('Natural Earth 1:50m via world-atlas 2.0.2');
const topo = JSON.parse((await loadSource()).toString('utf8'));
const { scale, translate } = topo.transform;

// 1. Arcs terug naar graden. TopoJSON bewaart delta's op een geheeltallig raster.
const arcsLonLat = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
});
// Projecteren per arc (niet per ring), zodat vereenvoudigen later per arc kan.
const arcsProjected = arcsLonLat.map((arc) => arc.map(([lon, lat]) => project(lon, lat)));

/** Punten van een ring, opgebouwd uit arc-verwijzingen (negatief = omgekeerd gelezen). */
function ringPoints(refs, source) {
  const points = [];
  for (const r of refs) {
    const arc = r < 0 ? source[~r].slice().reverse() : source[r];
    for (let i = points.length ? 1 : 0; i < arc.length; i++) points.push(arc[i]);
  }
  return points;
}

const polygonsOf = (geometry) =>
  geometry.type === 'Polygon' ? [geometry.arcs] : geometry.type === 'MultiPolygon' ? geometry.arcs : [];

const inWindow = ([lon, lat]) =>
  lon > WINDOW.lonMin && lon < WINDOW.lonMax && lat > WINDOW.latMin && lat < WINDOW.latMax;

// 2. Welke polygonen doen mee.
const kept = [];                              // { name, code, polygons: [ringRefs[]] }
for (const geometry of topo.objects.countries.geometries) {
  const name = geometry.properties.name;
  const code = NAME_TO_CODE[name];
  if (!code) continue;

  const polygons = [];
  for (const polygon of polygonsOf(geometry)) {
    const outer = ringPoints(polygon[0], arcsLonLat);
    const mean = outer.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]).map((v) => v / outer.length);
    if (inWindow(mean)) polygons.push(polygon);
  }
  if (polygons.length) kept.push({ name, code, polygons });
}

// 3. Kader uit de uiterste punten van de randlanden.
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const country of kept) {
  if (!FRAME_CODES.has(country.code)) continue;
  for (const polygon of country.polygons) {
    for (const ring of polygon) {
      for (const [x, y] of ringPoints(ring, arcsProjected)) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
}
const padX = (maxX - minX) * FRAME_MARGIN, padY = (maxY - minY) * FRAME_MARGIN;
minX -= padX; maxX += padX; minY -= padY; maxY += padY;

const S = VIEWBOX_WIDTH / (maxX - minX);
const VIEWBOX_HEIGHT = Math.round((maxY - minY) * S);
const toViewBox = ([x, y]) => [(x - minX) * S, (y - minY) * S];

// 4. Arcs vereenvoudigen. Per arc, zodat twee buurlanden dezelfde grens delen.
const simplified = new Map();
function arc(index, context) {
  const key = `${index}${context ? 'c' : 'd'}`;
  if (!simplified.has(key)) simplified.set(key, simplify(arcsProjected[index].map(toViewBox), context ? EPS_CONTEXT : EPS_DATA));
  return simplified.get(key);
}
function ring(refs, context) {
  const points = [];
  for (const r of refs) {
    const a = r < 0 ? arc(~r, context).slice().reverse() : arc(r, context);
    for (let i = points.length ? 1 : 0; i < a.length; i++) points.push(a[i]);
  }
  return points;
}

// 5. Per code samenvoegen (Cyprus + Noord-Cyprus) en eilandjes wegfilteren.
const merged = {};
for (const country of kept) {
  const context = !DATA_CODES.has(country.code);
  const polygons = country.polygons.map((polygon) => polygon.map((refs) => ring(refs, context)));

  const sized = polygons.map((p) => ({ p, a: ringArea(p[0]) })).sort((a, b) => b.a - a.a);
  const minArea = context ? MIN_ISLAND_CONTEXT : MIN_ISLAND_DATA;
  const survivors = sized.filter((s, i) => i === 0 || s.a >= minArea);

  const entry = (merged[country.code] ||= { context, polygons: [], name: country.name });
  entry.polygons.push(...survivors.map((s) => s.p));
}

const countries = {};
for (const [code, entry] of Object.entries(merged)) {
  const polygons = entry.polygons.sort((a, b) => ringArea(b[0]) - ringArea(a[0]));
  const [lx, ly, lr] = polylabel(polygons[0], LABEL_PRECISION);
  countries[code] = {
    ctx: entry.context ? 1 : 0,
    name: entry.name,
    d: toPath(polygons.flat()),
    lx: +lx.toFixed(1), ly: +ly.toFixed(1), lr: +lr.toFixed(1),
    area: +polygons.reduce((s, p) => s + ringArea(p[0]), 0).toFixed(1),
  };
}

// 6. Controle: elk datateland moet er zijn, anders mist de kaart stil een land.
const missing = [...DATA_CODES].filter((code) => !countries[code]);
if (missing.length) {
  throw new Error(
    `Landen ontbreken in de kaart: ${missing.join(', ')}.\n` +
    'Waarschijnlijk is een naam in NAME_TO_CODE niet gelijk aan properties.name in de bron, of ' +
    'valt het hele land buiten WINDOW. Een land zonder pad krijgt op de pagina nooit een kleur.',
  );
}
for (const [code, c] of Object.entries(countries)) {
  if (!c.d.startsWith('M')) throw new Error(`${code}: leeg of ongeldig pad.`);
}

await mkdir(OUT_DIR, { recursive: true });
const json = JSON.stringify({ w: VIEWBOX_WIDTH, h: VIEWBOX_HEIGHT, countries }) + '\n';
await writeFile(new URL('europe.json', OUT_DIR), json);

const data = Object.values(countries).filter((c) => !c.ctx).length;
console.log(`  viewBox ${VIEWBOX_WIDTH} x ${VIEWBOX_HEIGHT}`);
console.log(`  ${Object.keys(countries).length} landen (${data} met Eurostat-data, ${Object.keys(countries).length - data} achtergrond)`);
console.log(`  data/geo/europe.json, ${json.length.toLocaleString('en-US')} bytes`);

// ---------------------------------------------------------------------------
// 7. Dezelfde bron, maar in graden: de bol op de voordeur.
//
// De kaart hierboven is voorgeprojecteerd naar 2D en daarmee plat. Een bol draait,
// dus die heeft lengte en breedte nodig en projecteert in de browser. Het is bewust
// een tweede bestand en geen tweede veld: de kaart staat op elke metriekpagina en
// hoeft deze punten nooit te laden.
//
// Het gaat naar public/ en niet naar data/, omdat de browser het ophaalt in plaats
// van dat Astro het meebouwt. Meesturen zou de HTML van de voordeur viermaal zo
// zwaar maken (21,7 kB gzip tegen 7,8 kB voor de hele pagina), en juist daar komen
// advertenties bij.
// ---------------------------------------------------------------------------

/**
 * Vereenvoudiging in graden, fijner voor de 34 datalanden dan voor de achtergrond —
 * dezelfde splitsing als EPS_DATA tegen EPS_CONTEXT op de platte kaart. Bij 0,45 werd
 * Cyprus een vierhoek; de achtergrond mag dat wel zijn, want daar kijkt niemand naar.
 */
const GLOBE_EPS_DATA = 0.2;
const GLOBE_EPS_CONTEXT = 0.45;
/** Een achtergrondvorm die op die schaal geen pixel haalt kost alleen bytes. */
const GLOBE_MIN_SPAN = 1.2;
/** Voor een dataland alleen de echte splinters; Malta is 0,22 graad en moet blijven. */
const GLOBE_MIN_DATA_SPAN = 0.12;

const GLOBE_DIR = new URL('../public/geo/', import.meta.url);

const globe = [];
let globePoints = 0;

for (const geometry of topo.objects.countries.geometries) {
  const name = geometry.properties?.name;
  const code = NAME_TO_CODE[name] ?? null;
  const isData = code !== null && DATA_CODES.has(code);

  const rings = [];

  for (const polygon of polygonsOf(geometry)) {
    const raw = ringPoints(polygon[0], arcsLonLat);
    const lons = raw.map((p) => p[0]);
    const lats = raw.map((p) => p[1]);
    const span = Math.max(Math.max(...lons) - Math.min(...lons), Math.max(...lats) - Math.min(...lats));

    // Achtergrondland mag wegvallen als het te klein is om te zien; een dataland niet.
    if (!isData && span < GLOBE_MIN_SPAN) continue;
    if (isData && span < GLOBE_MIN_DATA_SPAN) continue;

    // Een vorm die kleiner is dan de tolerantie overleeft het vereenvoudigen niet:
    // Malta is 0,22 graad en werd er een lijn van twee punten van. Voor een dataland
    // houden we dan de ruwe vorm (Malta: acht punten). Voor achtergrond niet - dat zijn
    // duizenden eilandjes wereldwijd, en die terugval verdubbelde het bestand.
    const thin = simplify(raw, isData ? GLOBE_EPS_DATA : GLOBE_EPS_CONTEXT);
    const ring = (thin.length >= 4 || !isData ? thin : raw)
      .map(([lon, lat]) => [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100]);
    if (ring.length < 4) continue;

    // Overzeese departementen horen niet mee te kleuren. Natural Earth geeft Frankrijk
    // als één vorm inclusief Frans-Guyana; op de platte kaart valt dat buiten het kader,
    // op een bol zweeft er dan een gekleurde vlek bij Zuid-Amerika.
    if (isData && !ring.some(inWindow)) continue;

    rings.push(ring);
    globePoints += ring.length;
  }

  if (rings.length) globe.push({ n: name, c: isData ? code : null, r: rings });
}

await mkdir(GLOBE_DIR, { recursive: true });
const globeJson = JSON.stringify({ generated: new Date().toISOString().slice(0, 10), countries: globe }) + '\n';
await writeFile(new URL('globe.json', GLOBE_DIR), globeJson);

const globeData = globe.filter((c) => c.c).length;
console.log(`  public/geo/globe.json, ${globeJson.length.toLocaleString('en-US')} bytes`);
console.log(`  ${globe.length} landen in graden (${globeData} met data), ${globePoints.toLocaleString('en-US')} punten`);
