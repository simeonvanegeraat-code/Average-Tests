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
import { readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SITE = 'https://www.humanaverage.com';
const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Pagina's die wel bereikbaar moeten zijn maar niet in de index horen. */
const EXCLUDE = [
  /^404\.html$/,
  /^_astro\//,
  // De Nederlandse testtools: 110 tot 244 woorden rond een widget. AdSense merkte de
  // site aan als "content van weinig waarde", en dit waren de dunste pagina's die we
  // aanmeldden. Ze dragen nu zelf een noindex en blijven gewoon bereikbaar.
  /^tools\//,
];

async function walk(dir, found = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, found);
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

const files = await walk(DIST);

const urls = files
  .map((file) => relative(DIST, file).split('\\').join('/'))
  .filter((rel) => !EXCLUDE.some((re) => re.test(rel)))
  // index.html wordt de map zelf: /height/index.html -> /height/
  .map((rel) => (rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel))
  .map((path) => `${SITE}/${path}`)
  .sort();

// De datum van de laatste wijziging per bestand, zodat lastmod iets betekent.
const lastmod = new Map();
for (const file of files) {
  const rel = relative(DIST, file).split('\\').join('/');
  const path = rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel;
  const info = await stat(file);
  lastmod.set(`${SITE}/${path}`, info.mtime.toISOString().slice(0, 10));
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => [
    '  <url>',
    `    <loc>${url}</loc>`,
    `    <lastmod>${lastmod.get(url)}</lastmod>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
  '',
].join('\n');

await writeFile(join(DIST, 'sitemap.xml'), xml);

// public/sitemap.xml blijft bestaan voor wie de repo leest, maar de build is leidend.
const previous = await readFile(join(DIST, 'sitemap.xml'), 'utf8').catch(() => '');
console.log(`sitemap.xml: ${urls.length} URL's (${previous ? 'geschreven' : 'fout'})`);
