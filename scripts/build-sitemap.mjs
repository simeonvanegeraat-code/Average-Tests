/**
 * Genereert dist/sitemap.xml uit wat er daadwerkelijk gebouwd is.
 *
 * Draait na `astro build` (zie het build-script in package.json). Handmatig
 * bijhouden werd onhoudbaar zodra de drempelpagina's erbij kwamen, en een sitemap
 * die achterloopt op de site is erger dan geen.
 *
 * Bewust geen @astrojs/sitemap: die dekt alleen de Astro-pagina's, terwijl het
 * bevroren Nederlandse cluster als statische bestanden in public/ staat. Dit script
 * loopt over de build en pakt dus allebei.
 */
import { readdir, writeFile, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SITE = 'https://www.humanaverage.com';
const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Pagina's die wel bereikbaar moeten zijn maar niet in de index horen. */
const EXCLUDE = [/^404\.html$/, /^_astro\//];

/**
 * Een pagina die zichzelf op noindex zet, hoort niet in de sitemap.
 *
 * Dit is geen tweede lijst maar een vraag aan de pagina zelf, en dat is met opzet. Op
 * 3 november stonden de veertig Nederlandse pagina's op noindex én in de sitemap, en dat
 * levert in Search Console veertig "Submitted URL marked noindex"-fouten op — in het
 * enige meetinstrument dat deze site heeft. Een tweede lijst hier zou precies die fout
 * opnieuw mogelijk maken zodra het noindex ergens verandert.
 *
 * Zo niet: zodra BaseV2 het noindex eraf haalt, komen die URL's hier vanzelf weer in.
 */
const isNoindex = (html) => /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html);

async function walk(dir, found = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, found);
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

const all = await walk(DIST);

/** Eén keer lezen, en daarna zowel voor de filter als voor lastmod gebruiken. */
const noindex = new Set();
for (const file of all) {
  if (isNoindex(await readFile(file, 'utf8'))) noindex.add(file);
}

const files = all.filter((file) => !noindex.has(file));

const urls = files
  .map((file) => relative(DIST, file).split('\\').join('/'))
  .filter((rel) => !EXCLUDE.some((re) => re.test(rel)))
  // index.html wordt de map zelf: /height/index.html -> /height/
  .map((rel) => (rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel))
  .map((path) => `${SITE}/${path}`)
  .sort();

/**
 * Geen <lastmod>. Die stond er, uit de wijzigingstijd van het gebouwde bestand, en op
 * Vercel is dat voor elk bestand het moment van de build: op 15 november 2026 droegen
 * alle 40 URL's de datum van die dag. Google gebruikt het veld alleen als het klopt, en
 * een datum die bij elke deploy verspringt leert hem dat het niets betekent.
 *
 * Een echte datum vraagt dat de pagina zelf zegt wanneer haar cijfers veranderden, net
 * zoals ze hierboven zelf zegt dat ze op noindex staat. Tot dat er is: een lege plek in
 * plaats van een datum die niet waar is.
 */

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => [
    '  <url>',
    `    <loc>${url}</loc>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
  '',
].join('\n');

await writeFile(join(DIST, 'sitemap.xml'), xml);

// public/sitemap.xml blijft bestaan voor wie de repo leest, maar de build is leidend.
const previous = await readFile(join(DIST, 'sitemap.xml'), 'utf8').catch(() => '');
console.log(
  `sitemap.xml: ${urls.length} URL's (${previous ? 'geschreven' : 'fout'})` +
    (noindex.size ? `, ${noindex.size} overgeslagen wegens noindex` : ''),
);
