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
 *
 *   PAS BIJ FASE 3/4, als er Nederlandse pagina's zijn om tegen te meten
 *   2. Engelse tekst op een Nederlandse pagina — mét de uitzondering voor de
 *      geciteerde definitie van de uitgever, die daar met opzet Engels is (besluit 1
 *      van 1 november 2026). Een poort die dat niet weet, blokkeert precies de tekst
 *      die er hoort te staan, en een poort die onterecht afgaat wordt uitgezet.
 *   5. Een getal met een punt als decimaalteken op een Nederlandse pagina.
 *   6. Een geciteerde definitie zonder `lang`-attribuut.
 *
 * Deze poort leest de data en de bron, niet het gebouwde bestand — behalve voor de
 * controles die over de gebouwde HTML gáán. Dat is met opzet: een poort die het
 * gebouwde bestand gelooft, controleert zijn eigen uitvoer.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
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
  [
    'src/pages/[...lang]/wealth/[country].astro',
    'regel 337 is een SVG-breedte en hoort zo. Regel 150 is WEL tekst ("1.4% over the year") en moet nog door de grens — dat bestand is op 1 november 2026 in gebruik bij een andere sessie, en één sessie is eigenaar van een bestand',
  ],
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
