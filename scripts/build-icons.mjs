/**
 * Bouwt de favicons uit public/favicon-ha.svg.
 *
 *   node scripts/build-icons.mjs
 *
 * Waarom dit bestaat. De site had alleen een SVG-icoon. Dat werkt in elke browser —
 * het tabblad klopte — maar **Google haalt daarnaast `/favicon.ico` op**, en die gaf
 * 404. In de zoekresultaten stond daardoor niet ons icoon maar de terugval van Google.
 * Gezien op 26 oktober 2026 naast het eerste resultaat voor "average retirement age by
 * country europe".
 *
 * Geen dependency: de SVG wordt in dezelfde headless Chrome gerenderd die ook
 * scripts/check-pages.mjs aanstuurt, en het ICO-omhulsel om de PNG is 22 bytes die
 * hieronder met de hand gezet worden.
 *
 * Uitvoer (allemaal in public/, want de browser haalt ze rechtstreeks op):
 *
 *   favicon.ico          32x32, het pad dat Google en oude browsers zelf proberen
 *   icon-192.png         voor Android en als expliciete PNG-terugval
 *   apple-touch-icon.png 180x180, wat iOS op het beginscherm zet
 */
import { spawn } from 'node:child_process';
import { readFile, writeFile, rm } from 'node:fs/promises';

const PUBLIC = new URL('../public/', import.meta.url);
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG = Number(process.env.ICON_DEBUG_PORT ?? 9411);
const PROFILE = new URL('../dist-shots/.chrome-icons/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const svg = await readFile(new URL('favicon-ha.svg', PUBLIC), 'utf8');

await rm(PROFILE, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${PROFILE}`,
  '--disable-gpu', '--hide-scrollbars', '--no-first-run', 'about:blank',
], { stdio: 'ignore' });

chrome.on('error', (error) => {
  console.error(`Chrome start niet (${CHROME}): ${error.message}\nZet CHROME= naar het pad van je browser.`);
  process.exit(1);
});

async function target() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG}/json/new?about:blank`, { method: 'PUT' });
      if (response.ok) return (await response.json()).webSocketDebuggerUrl;
    } catch {}
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`Chrome luistert niet op poort ${DEBUG}.`);
}

const socket = new WebSocket(await target());
await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });

let next = 1;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const waiting = pending.get(message.id);
  if (!waiting) return;
  pending.delete(message.id);
  message.error ? waiting.fail(new Error(JSON.stringify(message.error))) : waiting.done(message.result);
};
const send = (method, params = {}) =>
  new Promise((done, fail) => {
    const id = next++;
    pending.set(id, { done, fail });
    socket.send(JSON.stringify({ id, method, params }));
  });

await send('Page.enable');

/** De SVG op precies `size` pixels, zonder marge eromheen. */
async function render(size) {
  const page =
    '<!doctype html><meta charset="utf-8">' +
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>` +
    svg;
  await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(page) });
  await new Promise((done) => setTimeout(done, 400));
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  return Buffer.from(data, 'base64');
}

/**
 * Een ICO met één PNG erin. Sinds Vista mag dat, en het scheelt een bitmapencoder.
 * De kop is zes bytes, de ene ingang zestien, dan volgt de PNG ongewijzigd.
 */
function ico(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);            // gereserveerd
  header.writeUInt16LE(1, 2);            // type 1 = icoon
  header.writeUInt16LE(1, 4);            // één afbeelding
  header.writeUInt8(size % 256, 6);      // breedte (0 betekent 256)
  header.writeUInt8(size % 256, 7);      // hoogte
  header.writeUInt8(0, 8);               // geen kleurenpalet
  header.writeUInt8(0, 9);               // gereserveerd
  header.writeUInt16LE(1, 10);           // kleurvlakken
  header.writeUInt16LE(32, 12);          // bits per pixel
  header.writeUInt32LE(png.length, 14);  // grootte van de afbeelding
  header.writeUInt32LE(22, 18);          // waar de afbeelding begint
  return Buffer.concat([header, png]);
}

const png32 = await render(32);
const png192 = await render(192);
const png180 = await render(180);

await writeFile(new URL('favicon.ico', PUBLIC), ico(png32, 32));
await writeFile(new URL('icon-192.png', PUBLIC), png192);
await writeFile(new URL('apple-touch-icon.png', PUBLIC), png180);

console.log(`  public/favicon.ico          ${ico(png32, 32).length} bytes (32x32 PNG in een ICO)`);
console.log(`  public/icon-192.png         ${png192.length} bytes`);
console.log(`  public/apple-touch-icon.png ${png180.length} bytes`);

socket.close();
chrome.kill();
// De profielmap blijft staan: Chrome laat zijn lockfile pas na het afsluiten los, en
// er meteen overheen willen laat dit script falen nadat het zijn werk al gedaan heeft.
// dist-shots/ staat in .gitignore, dus hij komt nergens terecht.
