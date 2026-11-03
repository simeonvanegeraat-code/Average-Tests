/**
 * De poort op de taalgrens.
 *
 * CLAUDE.md: elke bron heeft een validate-script dat moet slagen voordat er iets
 * gepubliceerd wordt, en een taal is hier zo'n bron. Het plan in
 * research/i18n-plan.md noemt zes dingen die deze poort moet tegenhouden. Drie
 * daarvan kunnen nu, en drie pas als er een tweede taal staat:
 *
 *   NU
 *   1. Een sleutel die in de ene taal bestaat en in de andere niet.
 *   3. Een `lang`-attribuut dat niet overeenkomt met het URL-voorvoegsel. Dit is
 *      letterlijk de bug van eudebtmap.com, en een poort is de enige reden dat hij
 *      hier niet ook een jaar blijft staan.
 *   4. Een `hreflang`-verzameling die niet wederkerig is of waar `x-default` ontbreekt.
 *   + Een getal dat buiten de taalgrens om wordt opgemaakt. Staat niet in het plan,
 *     maar is de reden dat fase 2 bestaat: één bypass en een Nederlandse pagina
 *     schrijft alsnog `24.6`.
 *   + Een taal in LOCALES zonder lidwoordtabel in grammar.js, of een tabel die een
 *     naam noemt die in het woordenbestand van die taal niet voorkomt.
 *   + Een taal in LOCALES zonder zinsbouwers, of een zinsbouwer die niet dezelfde
 *     functies exporteert als de standaardtaal.
 *   + Een taal in LOCALES zonder vaste tekst in ui.json, of een ui.json met andere
 *     sleutels dan de standaardtaal.
 *   + Een taal in LOCALES zonder metriekwoorden, een woordenbestand met andere
 *     sleutels dan de standaardtaal, of een klasselabel waarvan de getallen niet de
 *     klassegrenzen zijn die het beschrijft.
 *   + Structured data die een andere taal of een andere pagina aanwijst dan de pagina
 *     waar hij op staat. Dezelfde bug als regel 3, maar in JSON-LD in plaats van in
 *     het lang-attribuut — en daar ziet niemand hem, want er staat niets van op de
 *     pagina.
 *
 *   PAS BIJ FASE 3/4, als er Nederlandse pagina's zijn om tegen te meten
 *   2. Engelse tekst op een Nederlandse pagina — mét de uitzondering voor de
 *      geciteerde definitie van de uitgever, die daar met opzet Engels is (besluit 1
 *      van 1 november 2026). Een poort die dat niet weet, blokkeert precies de tekst
 *      die er hoort te staan, en een poort die onterecht afgaat wordt uitgezet.
 *   5. Een getal met een punt als decimaalteken op een Nederlandse pagina.
 *   6. Een geciteerde definitie zonder `lang`-attribuut.
 *   + Een interne link op een Nederlandse pagina die het taalvoorvoegsel mist. Staat
 *     niet in het plan en is er in november bij gekomen; hij stond hier even als een
 *     tweede "6".
 *
 * Deze poort leest de data en de bron, niet het gebouwde bestand — behalve voor de
 * controles die over de gebouwde HTML gáán. Dat is met opzet: een poort die het
 * gebouwde bestand gelooft, controleert zijn eigen uitvoer.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
/**
 * De enige bron die deze poort inlaadt in plaats van als tekst te lezen. Dat mag hier,
 * en nergens anders: grammar.js is gewoon JavaScript zonder JSON-import en zonder iets
 * van de bundler, dus plain Node kan hem lezen — net als country-names.js, en om
 * dezelfde reden. Een tabel met een reguliere expressie uitlezen zou hem controleren
 * op zijn vorm en niet op zijn inhoud.
 */
import { GRAMMAR_LANGUAGES, articleNames } from '../src/lib/grammar.js';
import { METRIC_LANGUAGES, metricWords } from '../src/lib/metric-names.js';
import { UI_LANGUAGES, uiRaw } from '../src/lib/ui.js';
import { COPY_LANGUAGES as MAP_COPY } from '../src/lib/metric-map.js';
import { COPY_LANGUAGES as HOME_COPY } from '../src/lib/leaving-home-copy.js';
import { join, relative, sep } from 'node:path';

const problems = [];
const notes = [];
const fail = (what) => problems.push(what);

/* === de actieve talen ====================================================== */

/**
 * `LOCALES` in src/lib/locales.js is de schakelaar: wat daar staat, wordt gebouwd.
 * De poort leest die regel in plaats van de module te importeren, want een poort die
 * de code importeert die hij controleert, controleert niets.
 */
function activeLocales() {
  const source = readFileSync('src/lib/locales.js', 'utf8');
  const line = /export const LOCALES = \[([^\]]*)\]/.exec(source);
  if (!line) {
    fail('src/lib/locales.js: geen `export const LOCALES = [...]` gevonden. Is de vorm van de schakelaar veranderd? Dan moet deze poort mee.');
    return [];
  }
  const found = [...line[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
  if (found.length === 0) fail('src/lib/locales.js: LOCALES is leeg.');
  return found;
}

function defaultLocale() {
  const source = readFileSync('src/lib/locales.js', 'utf8');
  const line = /export const DEFAULT_LOCALE = '([a-z-]+)'/.exec(source);
  if (!line) {
    fail('src/lib/locales.js: geen `export const DEFAULT_LOCALE` gevonden.');
    return 'en';
  }
  return line[1];
}

const LOCALES = activeLocales();
const DEFAULT = defaultLocale();

/* === 1. de woordenbestanden ================================================ */

/** Eurostat noemt de sleutel `code`, de ECB `area`. */
const codeOf = (row) => row.code ?? row.area ?? null;

/** Elke code die ergens in de data voorkomt, met de naam die de data eraan geeft. */
function codesInData() {
  const names = new Map();
  for (const entry of readdirSync('data', { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let index;
    try {
      index = JSON.parse(readFileSync(`data/${entry.name}/index.json`, 'utf8'));
    } catch {
      continue;
    }
    for (const group of ['countries', 'aggregates']) {
      for (const row of index[group] ?? []) {
        const code = codeOf(row);
        if (code && typeof row.name === 'string') names.set(code, row.name);
      }
    }
  }
  return names;
}

const inData = codesInData();
if (inData.size === 0) fail('Geen enkele landnaam gevonden onder data/. Draait dit uit de wortel van de repo?');

for (const lang of LOCALES) {
  const file = `src/locales/${lang}/countries.json`;
  if (!existsSync(file)) {
    fail(`${file} bestaat niet, terwijl '${lang}' in LOCALES staat. Een actieve taal zonder woordenbestand levert pagina's met de namen van een andere taal.`);
    continue;
  }

  const words = JSON.parse(readFileSync(file, 'utf8'));

  const missing = [...inData.keys()].filter((code) => !(code in words));
  if (missing.length) {
    fail(`${file}: ${missing.length} code(s) uit de data ontbreken: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' …' : ''}`);
  }

  const stale = Object.keys(words).filter((code) => !inData.has(code));
  if (stale.length) {
    fail(`${file}: ${stale.length} code(s) staan er wel in maar in geen enkele dataset: ${stale.slice(0, 12).join(', ')}${stale.length > 12 ? ' …' : ''}`);
  }

  const empty = Object.entries(words).filter(([, name]) => typeof name !== 'string' || name.trim() === '');
  if (empty.length) {
    fail(`${file}: ${empty.length} code(s) zonder naam: ${empty.map(([c]) => c).join(', ')}. Een lege naam wordt een lege cel op een pagina.`);
  }

  /**
   * Het bestand van de standaardtaal is gegenereerd uit de data (zie
   * scripts/build-locale-names.mjs) en hoort daar dus exact gelijk aan te zijn. Dit is
   * de controle die drift opmerkt: herziet een bron een naam, dan gaat de data mee en
   * het woordenbestand niet, en zegt een pagina iets anders dan de tabel ernaast.
   */
  if (lang === DEFAULT) {
    const drifted = [...inData].filter(([code, name]) => code in words && words[code] !== name);
    if (drifted.length) {
      fail(
        `${file}: ${drifted.length} naam/namen wijken af van de data. Draai \`npm run locales:build\`.\n` +
          drifted.slice(0, 8).map(([code, name]) => `      ${code}: data "${name}" tegenover bestand "${words[code]}"`).join('\n'),
      );
    }
  }
}

/**
 * Kent de code de taal ook, of alleen de map?
 *
 * `country-names.js` houdt een expliciete lijst (`const NAMES = { en }`) in plaats van
 * de map af te zoeken, zodat de grens buiten de bundler te testen is. De prijs daarvan
 * is dat je hem kunt vergeten: woordenbestand erbij, taal in LOCALES, poort tevreden —
 * en dan bouwt de site Nederlandse pagina's met Engelse landnamen. Zonder deze controle
 * is dat een stille fout, en gevonden met de proefrit van 1 november 2026.
 */
{
  const source = readFileSync('src/lib/country-names.js', 'utf8');
  const map = /const NAMES = \{([^}]*)\}/.exec(source);
  if (!map) {
    fail('src/lib/country-names.js: geen `const NAMES = { … }` gevonden. Is de vorm veranderd? Dan moet deze poort mee.');
  } else {
    const known = map[1].split(',').map((part) => part.split(':')[0].trim()).filter(Boolean);
    for (const lang of LOCALES) {
      if (!known.includes(lang)) {
        fail(`src/lib/country-names.js: '${lang}' staat in LOCALES maar niet in NAMES, dus localise() geeft die taal de namen van de standaardtaal. Voeg de import en de regel in NAMES toe.`);
      }
    }
  }
}

/**
 * Kent de grammatica de taal ook?
 *
 * Dezelfde valkuil als bij NAMES hierboven, een laag dieper. `withArticle()` valt
 * terug op de standaardtaal als een taal geen lidwoordtabel heeft, en dat is de juiste
 * keuze — een ontbrekend lidwoord is beter dan een lege naam. Maar het is ook stil: op
 * een Nederlandse pagina komt er dan "de Netherlands" te staan, of helemaal niets, en
 * geen build klaagt daarover.
 *
 * De tweede controle vangt de typefout. De tabel staat op naam en niet op landcode,
 * dus "Verenigde staten" met een kleine s doet precies niets en zegt niets. Elke naam
 * in de tabel moet een naam zijn die het woordenbestand van die taal ook echt kent.
 */
{
  for (const lang of LOCALES) {
    if (!GRAMMAR_LANGUAGES.includes(lang)) {
      fail(
        `src/lib/grammar.js: '${lang}' staat in LOCALES maar heeft geen lidwoordtabel, ` +
          'dus die taal krijgt de lidwoorden van de standaardtaal. Zet een regel in ARTICLES.',
      );
      continue;
    }

    const file = `src/locales/${lang}/countries.json`;
    if (!existsSync(file)) continue; // al gemeld bij de woordenbestanden hierboven

    const names = new Set(Object.values(JSON.parse(readFileSync(file, 'utf8'))));
    const unknown = articleNames(lang).filter((name) => !names.has(name));
    if (unknown.length) {
      fail(
        `src/lib/grammar.js: ARTICLES.${lang} noemt ${unknown.length} naam/namen die niet in ` +
          `${file} voorkomen: ${unknown.join(', ')}. Zo'n regel doet niets en meldt niets.`,
      );
    }
  }
}

/**
 * De zinsbouwers: bestaat de taal, en levert hij dezelfde functies?
 *
 * Deze laag valt net als de andere terug op de standaardtaal, en dat is hier het
 * gevaarlijkst van allemaal: een ontbrekende zinsbouwer geeft een vloeiende Engelse zin
 * midden op een Nederlandse pagina. Geen lege plek, geen `undefined` — een zin die er
 * goed uitziet en in de verkeerde taal staat. Dat is precies wat alleen een poort vindt.
 *
 * De tweede controle vergelijkt de geëxporteerde functies. Een copy-module die er één
 * mist, laat de aanroeper op `undefined is not a function` vallen bij de eerste bezoeker
 * die op dat pad komt — en dat pad kan "dit land heeft geen cijfer dit jaar" zijn, dus
 * niet het pad dat je zelf toevallig aanklikt.
 */
{
  const modules = [
    ['src/lib/metric-map.js', MAP_COPY, 'metric-map'],
    ['src/lib/leaving-home-copy.js', HOME_COPY, 'leaving-home'],
  ];

  for (const [waar, talen, bestand] of modules) {
    for (const lang of LOCALES) {
      if (!talen.includes(lang)) {
        fail(
          `${waar}: '${lang}' staat in LOCALES maar niet in COPY, dus die taal krijgt ` +
            `Engelse zinnen. Voeg src/locales/${lang}/copy/${bestand}.js toe plus de import en de regel.`,
        );
        continue;
      }
      if (lang === DEFAULT) continue;

      const [standaard, taal] = await Promise.all([
        import(`../src/locales/${DEFAULT}/copy/${bestand}.js`),
        import(`../src/locales/${lang}/copy/${bestand}.js`),
      ]);

      const verwacht = Object.keys(standaard.default ?? {}).sort();
      const heeft = new Set(Object.keys(taal.default ?? {}));
      const mist = verwacht.filter((k) => !heeft.has(k));
      if (mist.length) {
        fail(
          `src/locales/${lang}/copy/${bestand}.js mist ${mist.length} van ${verwacht.length} ` +
            `functie(s): ${mist.join(', ')}.`,
        );
      }
    }
  }
}

/**
 * De vaste tekst: bestaat de taal, en heeft hij dezelfde sleutels?
 *
 * `ui(lang)` legt het bestand van een taal óver het Engelse heen, dus een ontbrekende
 * sleutel geeft Engelse tekst in plaats van `undefined`. Dat is met opzet — undefined in
 * een sjabloon is een lege kop — maar het betekent ook dat een half vertaald bestand
 * nergens opvalt. Deze controle is de plek die het hoort te zeggen.
 *
 * Anders dan metrics.json wordt ui.json **niet** gegenereerd: de Engelse tekst stond
 * eerst in de .astro-bestanden en staat nu hier, dus dit bestand ís de bron. Er is dus
 * niets om hem tegen te vergelijken, en daarom is deze pariteitscontrole het enige wat
 * een gat kan vinden.
 */
{
  const paden = (obj, prefix = '') =>
    Object.entries(obj ?? {}).flatMap(([key, value]) =>
      value && typeof value === 'object' && !Array.isArray(value)
        ? paden(value, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    );

  const verwacht = new Set(paden(uiRaw(DEFAULT)));

  for (const lang of LOCALES) {
    if (!UI_LANGUAGES.includes(lang)) {
      fail(
        `src/lib/ui.js: '${lang}' staat in LOCALES maar niet in TEXT, dus ui() geeft die ` +
          'taal de vaste tekst van de standaardtaal. Voeg de import en de regel toe.',
      );
      continue;
    }
    if (lang === DEFAULT) continue;

    const heeft = new Set(paden(uiRaw(lang)));
    const mist = [...verwacht].filter((p) => !heeft.has(p));
    const over = [...heeft].filter((p) => !verwacht.has(p));

    if (mist.length) {
      fail(
        `src/locales/${lang}/ui.json: ${mist.length} van ${verwacht.size} sleutel(s) ontbreken, ` +
          `dus die tekst blijft Engels: ${mist.slice(0, 8).join(', ')}${mist.length > 8 ? ' …' : ''}`,
      );
    }
    if (over.length) {
      fail(
        `src/locales/${lang}/ui.json: ${over.length} sleutel(s) die de standaardtaal niet kent: ` +
          `${over.slice(0, 8).join(', ')}. Zo'n sleutel wordt nooit gelezen.`,
      );
    }
  }
}

/**
 * De metriekwoorden: bestaat de taal, heeft hij dezelfde sleutels, en kloppen de
 * klasselabels met hun grenzen?
 *
 * Drie dingen, en het derde is de interessante. Een klasselabel ("22 to 24") bevat de
 * grenzen die er als `until` al staan, en die dubbeling blijft bestaan omdat de opmaak
 * van dat getal per metriek met de hand gekozen is — build-locale-metrics.mjs legt uit
 * waarom er geen generator voor is. Wat wél kan, is nameten dat de twee niet zijn
 * weggedreven: de getallen in het label moeten precies de grenzen van die klasse zijn.
 *
 * Dat vangt twee fouten. Iemand die een grens verschuift en het label vergeet, en een
 * vertaler die "22 tot 24" overtypt als "22 tot 25". Het tweede is waarschijnlijker dan
 * het eerste, en geen van beide is op de kaart te zien zonder de legenda na te rekenen.
 */
{
  /** De grenzen komen uit de beschrijving, niet uit het woordenbestand. */
  const bandsPerMetric = new Map();
  for (const name of readdirSync('src/lib/metrics').filter((f) => f.endsWith('.js'))) {
    const cfg = (await import(`../src/lib/metrics/${name}`)).default;
    bandsPerMetric.set(cfg.key, cfg.bands);
  }

  const defaultWords = metricWords(DEFAULT);

  /** Het decimaalteken van een taal, zodat "2,0" als 2 gelezen wordt en niet als 20. */
  const separatorOf = (lang) =>
    new Intl.NumberFormat(lang)
      .formatToParts(1.5)
      .find((part) => part.type === 'decimal')?.value ?? '.';

  for (const lang of LOCALES) {
    if (!METRIC_LANGUAGES.includes(lang)) {
      fail(
        `src/lib/metric-names.js: '${lang}' staat in LOCALES maar niet in WORDS, dus ` +
          'localiseMetric() geeft die taal de woorden van de standaardtaal. Voeg de import en de regel toe.',
      );
      continue;
    }

    const words = metricWords(lang);

    /** Dezelfde metrieken, en per metriek dezelfde woordsleutels. */
    for (const key of Object.keys(defaultWords)) {
      if (!words[key]) {
        fail(`src/locales/${lang}/metrics.json: metriek '${key}' ontbreekt.`);
        continue;
      }
      for (const [group, shape] of [
        ['words', defaultWords[key].words],
        ['input', defaultWords[key].input],
      ]) {
        if (!shape) continue;
        const missing = Object.keys(shape).filter((k) => words[key][group]?.[k] === undefined);
        if (missing.length) {
          fail(`src/locales/${lang}/metrics.json: ${key}.${group} mist ${missing.join(', ')}.`);
        }
      }
      const lenses = Object.keys(defaultWords[key].lenses ?? {});
      const missingLenses = lenses.filter((l) => !words[key].lenses?.[l]);
      if (missingLenses.length) {
        fail(`src/locales/${lang}/metrics.json: ${key}.lenses mist ${missingLenses.join(', ')}.`);
      }
    }

    const extra = Object.keys(words).filter((k) => !defaultWords[k]);
    if (extra.length) {
      fail(
        `src/locales/${lang}/metrics.json: ${extra.length} metriek(en) die de standaardtaal niet kent: ` +
          `${extra.join(', ')}. Zo'n sleutel wordt nooit gelezen.`,
      );
    }

    /** De klasselabels tegen hun grenzen. */
    const sep = separatorOf(lang);
    for (const [key, bands] of bandsPerMetric) {
      const labels = words[key]?.bands;
      if (!Array.isArray(labels)) continue;

      if (labels.length !== bands.length) {
        fail(
          `src/locales/${lang}/metrics.json: ${key}.bands heeft ${labels.length} label(s) ` +
            `voor ${bands.length} klassen.`,
        );
        continue;
      }

      for (let i = 0; i < bands.length; i++) {
        const expected =
          i === 0
            ? [bands[0].until]
            : i === bands.length - 1
              ? [bands[i - 1].until]
              : [bands[i - 1].until, bands[i].until];

        const found = [...String(labels[i]).replaceAll(sep, '.').matchAll(/\d+(?:\.\d+)?/g)].map((m) =>
          Number(m[0]),
        );

        const same =
          found.length === expected.length && expected.every((n, j) => found[j] === n);
        if (!same) {
          fail(
            `src/locales/${lang}/metrics.json: ${key}.bands[${i}] is "${labels[i]}" maar de ` +
              `klasse loopt over ${expected.join('–')}. Het label en de grens zijn weggedreven.`,
          );
        }
      }
    }
  }
}

/** Een woordenbestand zonder actieve taal is werk in uitvoering, geen fout. */
if (existsSync('src/locales')) {
  const waiting = readdirSync('src/locales', { withFileTypes: true })
    .filter((e) => e.isDirectory() && !LOCALES.includes(e.name))
    .map((e) => e.name);
  if (waiting.length) notes.push(`woordenbestand aanwezig maar nog niet in LOCALES: ${waiting.join(', ')}`);
}

/* === 2. niemand maakt een getal op buiten de grens om ====================== */

/**
 * Deze controle is een ratel, niet een oordeel.
 *
 * `toFixed` en `toLocaleString` zijn niet altijd fout. Een CSS- of SVG-waarde moet juist
 * een punt houden — `oklch(0.45 …)`, `--at:62.5%`, `width="31.1"` — want een komma
 * breekt daar de pagina in plaats van hem te vertalen. En een afronding die een getal
 * kleiner maakt vóórdat het in een JSON-blok gaat, is rekenen en geen opmaak. Wat wél
 * fout is, is een getal dat als tékst bij een lezer belandt.
 *
 * Dat onderscheid kan een script niet zien: `const markerX = x(amount).toFixed(1)` staat
 * drie regels van de SVG waar hij in gebruikt wordt. Daarom staat hieronder per bestand
 * waarom het mag, en faalt de poort op elk bestand dat er niet in staat.
 *
 * WAT DEZE POORT DUS NIET ZIET: een nieuwe bypass in een bestand dat hier al staat. De
 * reden van elk bestand wordt daarom bij elke run afgedrukt, zodat een uitzondering die
 * niet meer klopt opvalt in plaats van te blijven liggen.
 */
const ALLOWED = new Map([
  ['src/lib/format.js', 'de grens zelf'],
  ['src/lib/metric.js', 'enkelvoud of meervoud uit het getal bepalen, niet uit de tekst'],
  ['src/lib/leaving-home.js', 'idem'],
  ['src/lib/home-countries.js', 'afronden om het JSON-blok klein te houden, geen opmaak'],
  ['src/components/Globe.astro', 'oklch()-kleurwaarden; een komma breekt de CSS'],
  ['src/layouts/BaseV2.astro', 'CSS custom property --at'],
  ['src/pages/404.astro', 'CSS custom property --at'],
  ['src/pages/[...lang]/index.astro', 'CSS custom property --at'],
  ['src/pages/[...lang]/wealth/index.astro', 'SVG-coördinaten en -breedtes'],
  ['src/pages/[...lang]/wealth/[country].astro', 'SVG-breedte, net als wealth/index.astro'],
  ['src/lib/threshold-explorer.js', 'dode code: nul importeurs (nagekeken 1 november 2026)'],
  ['src/lib/leaving-home-map.js', 'dode code: nul importeurs (nagekeken 1 november 2026)'],
]);

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (/\.(js|ts|astro)$/.test(entry.name)) yield path;
  }
}

const bypasses = new Map();
for (const path of sourceFiles('src')) {
  const text = readFileSync(path, 'utf8');
  const hits = [];
  text.split('\n').forEach((line, i) => {
    // Een commentaarregel telt niet mee: deze bestanden praten zelf over toFixed.
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
    const code = line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
    if (/\b(toFixed|toLocaleString)\s*\(/.test(code)) hits.push(i + 1);
  });
  if (hits.length) bypasses.set(path.split(sep).join('/'), hits);
}

for (const [path, lines] of bypasses) {
  if (!ALLOWED.has(path)) {
    fail(
      `${path}:${lines.join(',')} maakt zelf een getal op. Ga via src/lib/format.js, of zet hier in de poort waarom deze plek mag blijven (een CSS-waarde bijvoorbeeld).`,
    );
  }
}
for (const [path, reason] of ALLOWED) {
  if (!bypasses.has(path)) notes.push(`uitzondering niet meer nodig, haal hem weg: ${path}`);
  else notes.push(`eigen opmaak toegestaan in ${path} (${bypasses.get(path).length}x) — ${reason}`);
}

/* === 3 en 4. de gebouwde pagina's ========================================== */

/**
 * Deze twee gaan over de uitvoer, dus hier moet de poort wél in dist/ kijken. Zonder
 * build slaat hij ze over en zegt dat, in plaats van te doen alsof hij geslaagd is.
 */
function builtPages(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) builtPages(path, out);
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

const pages = builtPages('dist');
if (pages.length === 0) {
  notes.push('geen dist/ gevonden, dus de controles op lang en hreflang zijn overgeslagen — draai eerst `npm run build`');
} else {
  let checked = 0;

  for (const path of pages) {
    const url = `/${relative('dist', path).split(sep).join('/')}`.replace(/index\.html$/, '').replace(/\.html$/, '');
    const html = readFileSync(path, 'utf8');

    // 404.html staat met opzet buiten de taalroutering en heeft geen voorvoegsel.
    const first = url.split('/').filter(Boolean)[0];
    const prefix = LOCALES.includes(first) && first !== DEFAULT ? first : DEFAULT;

    const declared = /<html[^>]*\slang="([^"]*)"/.exec(html)?.[1];
    if (!declared) {
      fail(`${url}: geen lang-attribuut op <html>.`);
      continue;
    }
    if (declared !== prefix) {
      fail(`${url}: zegt lang="${declared}" terwijl de URL "${prefix}" aangeeft. Dit is de bug van eudebtmap.com.`);
    }

    const alternates = [...html.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]*)"[^>]*>/g)].map((m) => m[1]);

    if (LOCALES.length < 2) {
      /**
       * Met één taal hoort er geen enkele alternate te staan. `alternatesOf()` geeft
       * dan een lege lijst, en een hreflang die alleen naar zichzelf wijst zegt Google
       * niets. Staat er toch een, dan is de schakelaar en de layout uit elkaar gelopen.
       */
      if (alternates.length) fail(`${url}: ${alternates.length} hreflang-regel(s) terwijl er één taal actief is.`);
    } else {
      for (const lang of LOCALES) {
        if (!alternates.includes(lang)) fail(`${url}: hreflang voor "${lang}" ontbreekt.`);
      }
      const xDefault = alternates.filter((a) => a === 'x-default').length;
      if (xDefault !== 1) fail(`${url}: x-default staat er ${xDefault} keer, moet precies één keer.`);
    }

    /**
     * Structured data die zich op de verkeerde taal of de verkeerde pagina beroept.
     *
     * Dit is regel 3 nog een keer, maar in JSON-LD. Daar is hij erger, want een
     * verkeerd `lang`-attribuut kun je in de browser zien en dit niet: het staat in
     * een `<script>` dat alleen een zoekmachine leest.
     *
     * Twee dingen worden nagekeken. `inLanguage` moet zeggen wat `<html lang>` zegt —
     * op /nl/ stond hier `en-US` ingetypt. En een `@id` of `url` die naar een pagina
     * van deze site wijst, moet naar een pagina in **deze** taal wijzen: het
     * `mainEntityOfPage` van het artikel wees op /nl/ naar de Engelse pagina, dus
     * beweerde de Nederlandse pagina dat hij over een andere pagina ging.
     *
     * Alleen paden op deze site. Een `url` naar eurostat.ec.europa.eu of naar
     * schema.org is extern en draagt geen taal van ons.
     */
    for (const hit of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      let data;
      try {
        data = JSON.parse(hit[1]);
      } catch (e) {
        fail(`${url}: een ld+json-blok is geen geldige JSON (${e.message}).`);
        continue;
      }

      /** Elke sleutel op elke diepte, want deze knopen zitten in elkaar genest. */
      const walk = (node, visit) => {
        if (Array.isArray(node)) return node.forEach((n) => walk(n, visit));
        if (!node || typeof node !== 'object') return;
        visit(node);
        for (const value of Object.values(node)) walk(value, visit);
      };

      const site = String(readFileSync('astro.config.mjs', 'utf8').match(/site: '([^']+)'/)?.[1] ?? '');
      const verwacht = prefix === DEFAULT ? `${site}/` : `${site}/${prefix}/`;

      walk(data, (node) => {
        if (node.inLanguage !== undefined && node.inLanguage !== declared) {
          fail(
            `${url}: ld+json zegt inLanguage "${node.inLanguage}" terwijl <html lang> ` +
              `"${declared}" zegt. Dit is de bug van eudebtmap.com, nu in structured data.`,
          );
        }

        for (const key of ['@id', 'url']) {
          const value = node[key];
          if (typeof value !== 'string' || !value.startsWith(`${site}/`)) continue;
          if (value.startsWith(verwacht)) continue;
          fail(
            `${url}: ld+json ${key} is "${value}" en wijst daarmee buiten "${verwacht}". ` +
              'Reken hem uit met pageUrl()/siteIdentity() in src/lib/schema.js.',
          );
        }
      });
    }

    /**
     * Een interne link die het taalvoorvoegsel mist.
     *
     * Dit is de controle die voorkomt dat een taalversie veertig doodlopende pagina's
     * wordt. Op 2 november 2026 droeg nul van de 86 interne links een voorvoegsel: de
     * Nederlandse pagina's zouden gebouwd zijn, er goed uitzien, en bij de eerste klik
     * terug op het Engels komen. Een build die slaagt vindt dat niet.
     *
     * Wat hier wél een link naar een andere taal mag zijn: de taalkiezer. Die wijst
     * per definitie naar de andere talen, dus zijn `nav` gaat er eerst uit. Zonder dat
     * gaat deze poort af op precies de code die goed is — en een poort die onterecht
     * afgaat, wordt uitgezet.
     *
     * Alleen paginapaden. Een paginapad van deze site eindigt op een schuine streep,
     * eventueel met een anker; alles in public/ heeft een extensie en hoort geen
     * voorvoegsel te dragen.
     */
    if (prefix !== DEFAULT) {
      const zonderKiezer = html.replace(/<nav class="lang-switch"[\s\S]*?<\/nav>/g, '');
      const mis = new Set();

      for (const hit of zonderKiezer.matchAll(/href="(\/[^"\/][^"]*|\/)"/g)) {
        const path = hit[1];
        if (!/\/(#[^/]*)?$/.test(path)) continue; // geen pagina maar een bestand
        if (path === `/${prefix}/` || path.startsWith(`/${prefix}/`)) continue;
        mis.add(path);
      }

      if (mis.size) {
        const sample = [...mis].slice(0, 6).join(', ');
        fail(
          `${url}: ${mis.size} interne link(s) zonder het voorvoegsel "/${prefix}": ${sample}. ` +
            'Haal ze door linkTo(path, lang) in src/lib/locales.js.',
        );
      }
    }

    /**
     * Punt 5 van het plan: een getal met het verkeerde decimaalteken.
     *
     * Dit is de controle die een half afgemaakte vertaling tegenhoudt. De taalgrens in
     * src/lib/format.js kiest de notatie, maar iets moet hem de taal van de pagina
     * geven; gebeurt dat niet, dan staat er `24.6` op een Nederlandse pagina en ziet
     * niemand dat, want het is een plausibel getal. Op 1 november 2026 nagemeten met
     * een proefrit: zonder deze controle gaan er 240 van die getallen door.
     *
     * Twee dingen worden overgeslagen, en met reden:
     *   - scripts en JSON-blokken. Daar hoort juist een punt: dat is JavaScript, geen
     *     tekst, en een komma breekt het.
     *   - elk element met een eigen `lang` dat van de pagina afwijkt. Dat is de
     *     geciteerde definitie van de uitgever, die op een Nederlandse pagina met opzet
     *     Engels is (besluit 1 van 1 november 2026). Zonder die uitzondering faalt de
     *     poort op precies de tekst die er hoort te staan, en een poort die onterecht
     *     afgaat wordt uitgezet.
     */
    if (prefix !== DEFAULT) {
      const point = new Intl.NumberFormat(prefix, { minimumFractionDigits: 1 })
        .formatToParts(1.5)
        .find((part) => part.type === 'decimal')?.value;

      const visible = html
        .replace(/<script[\s\S]*?<\/script>/g, ' ')
        .replace(/<style[\s\S]*?<\/style>/g, ' ')
        .replace(new RegExp(`<(blockquote|p|span|q|div|dd|li)[^>]*\\slang="[^"]*"[^>]*>[\\s\\S]*?</\\1>`, 'g'), ' ')
        .replace(/<[^>]+>/g, ' ');

      const foreign = [...visible.matchAll(/\d+[.,]\d/g)]
        .map((hit) => hit[0])
        .filter((hit) => !hit.includes(point));

      if (foreign.length) {
        const sample = [...new Set(foreign)].slice(0, 6).join(', ');
        fail(
          `${url}: ${foreign.length} getal(len) met het verkeerde decimaalteken voor "${prefix}" (verwacht "${point}"): ${sample}. ` +
            'De taalgrens krijgt de taal van deze pagina niet mee.',
        );
      }
    }

    checked++;
  }

  notes.push(`${checked} gebouwde pagina('s) nagekeken op lang en hreflang`);
}

/* === uitkomst ============================================================== */

console.log(`  talen: ${LOCALES.join(', ')} (standaard: ${DEFAULT})`);
console.log(`  codes in de data: ${inData.size}`);
for (const note of notes) console.log(`  ${note}`);

if (problems.length) {
  console.error(`\n${problems.length} probleem/problemen:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('');
  process.exit(1);
}

console.log('\nAlles in orde.');
