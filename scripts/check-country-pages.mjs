/**
 * De lat voor de landpagina's onder /wealth/, gemeten op de gebouwde site.
 *
 *   npm run build && npm run check:country
 *   npm run check:country -- --lang nl     de Nederlandse pagina's (nog niet verbouwd)
 *
 * Waarom dit bestaat: in november 2026 deelden de 21 landpagina's per paar 64% van hun
 * tekst, en de zin die ze uit elkaar moest houden gaf in alle 21 landen hetzelfde
 * antwoord. Google noemt dat data-aggregatie zonder synthese, AdSense "content van weinig
 * waarde". De lat staat in research/wealth-country-pages-plan.md §5 en is hier code, zodat
 * een volgende verbouwing hem niet stilletjes kan laten zakken.
 *
 * Wat gemeten wordt, alleen binnen <main>:
 *
 *  1. Gedeelde tekst. Reeksen van vijf woorden: het aandeel van de reeksen van pagina A
 *     dat ook op pagina B staat. Een zin waarin alleen het bedrag verschilt telt als
 *     gedeeld, en dat is met opzet: zo leest een zoekmachine hem ook.
 *  2. Andere landen bij naam, als link naar hun eigen landpagina.
 *  3. Inkomende links vanuit de inhoud van andere pagina's (niet de kop of de voet, die
 *     staan op elke pagina en tellen als navigatie).
 *
 * Wat niet gemeten kan worden en daarom niet in de lat staat: of een getal met de hand
 * is getypt. Dat staat in de code, niet in de HTML; CLAUDE.md regel 5 en de review.
 *
 * Geen afhankelijkheden. Leest dist/, schrijft niets.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const args = process.argv.slice(2);
const lang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'en';
const prefix = lang === 'en' ? '' : `${lang}/`;

/** De lat. Verander hem alleen met een besluit van Simeon; zie het plan, §5. */
const BAR = {
  sharedMedian: 0.4,
  sharedMax: 0.5,
  namedCountries: 3,
  inboundLinks: 3,
};

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

const mainOf = (html) => (html.match(/<main[\s\S]*?<\/main>/i) || [''])[0];

const textOf = (main) =>
  decode(
    main
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();

const linksOf = (main) =>
  [...main.matchAll(/<a\b[^>]*href="([^"]+)"/gi)]
    .map((m) => m[1].replace('https://www.humanaverage.com', '').replace(/#.*$/, ''))
    .filter((h) => h.startsWith('/'));

function shingles(text, n = 5) {
  const words = text.toLowerCase().replace(/[^\p{L}\p{N}€%.,-]+/gu, ' ').trim().split(/\s+/);
  const set = new Set();
  for (let i = 0; i + n <= words.length; i += 1) set.add(words.slice(i, i + n).join(' '));
  return set;
}

const overlap = (a, b) => {
  let hit = 0;
  for (const s of a) if (b.has(s)) hit += 1;
  return a.size ? hit / a.size : 0;
};

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

const pathOf = (file) => `/${file.slice(DIST.length).replaceAll('\\', '/').replace(/index\.html$/, '')}`.replace(/^\/+/, '/');

const all = await walk(DIST);
const pages = [];
for (const file of all) pages.push({ path: pathOf(file), main: mainOf(await readFile(file, 'utf8')) });

const countryRe = new RegExp(`^/${prefix}wealth/[a-z]{2}/$`);
const countries = pages.filter((p) => countryRe.test(p.path));
if (countries.length === 0) {
  console.error(`Geen landpagina's gevonden onder /${prefix}wealth/<land>/. Eerst npm run build.`);
  process.exit(1);
}

for (const p of countries) {
  p.set = shingles(textOf(p.main));
  p.links = linksOf(p.main);
}

const problems = [];
const rows = [];
const pairs = [];

for (const p of countries) {
  const shared = countries.filter((q) => q !== p).map((q) => overlap(p.set, q.set));
  pairs.push(...shared);
  const named = new Set(p.links.filter((h) => countryRe.test(h) && h !== p.path));
  const inbound = pages.filter((q) => q.path !== p.path && linksOf(q.main).includes(p.path)).length;
  const worst = Math.max(...shared);
  rows.push({ path: p.path, worst, named: named.size, inbound });
  if (worst > BAR.sharedMax) problems.push(`${p.path}: deelt ${(worst * 100).toFixed(0)}% met een andere landpagina (lat ${BAR.sharedMax * 100}%)`);
  if (named.size < BAR.namedCountries) problems.push(`${p.path}: noemt ${named.size} ander(e) land(en) met een link (lat ${BAR.namedCountries})`);
  if (inbound < BAR.inboundLinks) problems.push(`${p.path}: ${inbound} inkomende link(s) vanuit de inhoud (lat ${BAR.inboundLinks})`);
}

const sorted = [...pairs].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
if (median > BAR.sharedMedian) problems.unshift(`gedeelde tekst per paar, mediaan ${(median * 100).toFixed(0)}% (lat ${BAR.sharedMedian * 100}%)`);

console.log(`${countries.length} landpagina's onder /${prefix}wealth/`);
console.log(`gedeelde tekst per paar: mediaan ${(median * 100).toFixed(0)}%, hoogste ${(sorted.at(-1) * 100).toFixed(0)}%`);
for (const r of rows.sort((a, b) => b.worst - a.worst)) {
  console.log(`  ${r.path.padEnd(18)} max gedeeld ${String(Math.round(r.worst * 100)).padStart(3)}%   landen genoemd ${r.named}   inkomend ${r.inbound}`);
}

if (problems.length) {
  console.log(`\n${problems.length} keer onder de lat:`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('\nAlles boven de lat.');
