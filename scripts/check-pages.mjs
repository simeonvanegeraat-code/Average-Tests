/**
 * Controleert de gebouwde site in een echte browser.
 *
 *   npm run check                      alle pagina's, breed-licht en smal-donker
 *   npm run check -- /pension-age/     alleen die pagina, alle breedtes en beide thema's
 *   npm run check -- --shots           plus een schermafdruk per combinatie in dist-shots/
 *
 * Draait na `npm run build` en leest `dist/`. Geen dependency: Node serveert de map
 * zelf en praat met een headless Chrome over het debugprotocol. Zet CHROME als je
 * browser ergens anders staat dan de standaardplek op Windows.
 *
 * **Waarom dit bestaat.** De paneelbrowser in de editor vuurt geen
 * requestAnimationFrame, dus alles wat animeert lijkt daar stuk, en naar een
 * schermafdruk kijken vindt niet wat hier gevonden moet worden. Alle vier de
 * controles hieronder hebben een echte fout op de live site gevangen:
 *
 * 1. **Onthulde blokken.** De observer achter `data-reveal` stond op drempel 0,15.
 *    Een blok hoger dan het venster gedeeld door die drempel haalt hem nooit — op
 *    een telefoon bleef zo een hele sectie op opacity 0 staan. Op een breed scherm
 *    was daar niets van te zien.
 * 2. **Echt klikken.** Het megamenu ving een dag lang geen enkele klik: `.nav-shell`
 *    zet `pointer-events: none` en `.catalogue` zette het niet terug. Kleuren,
 *    contrast en aria klopten allemaal. Alleen een echte muisklik vindt dit.
 * 3. **Rommel in de tekst.** "in  the EU Labour Force Survey was reorganized" stond
 *    er omdat het breukjaar null was. Een lege plek in een zin leest als een zin.
 * 4. **Overloop.** Alles wat buiten het venster steekt en niet in een scrollbaar
 *    gebied zit.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SHOT_DIR = new URL('../dist-shots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const PROFILE = new URL('../dist-shots/.chrome/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CHECK_PORT ?? 8099);
const DEBUG = Number(process.env.CHECK_DEBUG_PORT ?? 9333);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json',
};

const args = process.argv.slice(2);
const shots = args.includes('--shots');

/**
 * Een pagina noem je zonder schuine strepen: `npm run check -- pension-age`.
 *
 * Dat is geen smaak. Git Bash op Windows maakt van een argument dat met / begint
 * een echt pad — `/pension-age/` werd `C:/Program Files/Git/pension-age/`, de
 * filter vond niets, en het script controleerde zwijgend de hele site. Een
 * onbekende naam valt nu om met de lijst erbij in plaats van alles te draaien.
 */
const wanted = args
  .filter((arg) => !arg.startsWith('--'))
  .map((arg) => `/${arg.replace(/^[A-Za-z]:/, '').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/'));

/**
 * Zonder argumenten: elke pagina, breed in het licht en smal in het donker. Dat is
 * de combinatie waarin de fouten hierboven zaten, en het blijft onder de paar
 * minuten. Met een pagina als argument gaat die pagina door alle breedtes en beide
 * thema's.
 */
const BROAD = [
  { width: 1280, height: 900, dark: false },
  { width: 390, height: 780, dark: true },
];
const DEEP = [
  { width: 1280, height: 900, dark: false },
  { width: 1280, height: 900, dark: true },
  { width: 820, height: 900, dark: false },
  { width: 390, height: 780, dark: false },
  { width: 390, height: 780, dark: true },
];

async function pages() {
  const found = [];
  const walk = async (dir, prefix) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) await walk(join(dir, entry.name), `${prefix}${entry.name}/`);
      else if (entry.name === 'index.html') found.push(prefix);
    }
  };
  await walk(DIST, '/');
  found.sort();

  if (!wanted.length) return found;

  const unknown = wanted.filter((page) => !found.includes(page));
  if (unknown.length) {
    console.error(`Niet gebouwd: ${unknown.join(', ')}\nBedoelde je een van deze?\n  ${found.join('\n  ')}`);
    process.exit(1);
  }
  return wanted;
}

/** De map serveren zoals Vercel dat doet: /pad/ wordt /pad/index.html. */
function serve() {
  const server = createServer(async (request, response) => {
    let path = decodeURIComponent(request.url.split('?')[0]);
    if (path.endsWith('/')) path += 'index.html';
    try {
      const body = await readFile(join(DIST, path));
      response.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('404');
    }
  });
  return new Promise((done) => server.listen(PORT, '127.0.0.1', () => done(server)));
}

/** Een verse profielmap per run, anders lekt localStorage (thema, gekozen land) tussen runs. */
async function browser() {
  await rm(PROFILE, { recursive: true, force: true });
  await mkdir(PROFILE, { recursive: true });

  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${PROFILE}`,
    '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank',
  ], { stdio: 'ignore' });

  chrome.on('error', (error) => {
    console.error(`Chrome start niet (${CHROME}): ${error.message}\nZet CHROME= naar het pad van je browser.`);
    process.exit(1);
  });

  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG}/json/new?about:blank`, { method: 'PUT' });
      if (response.ok) return { chrome, url: (await response.json()).webSocketDebuggerUrl };
    } catch {}
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`Chrome luistert niet op poort ${DEBUG}.`);
}

/** Een kleine client voor het debugprotocol: Node 24 heeft WebSocket al aan boord. */
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((done, fail) => {
    socket.onopen = done;
    socket.onerror = () => fail(new Error('Verbinding met Chrome mislukt.'));
  });

  let next = 1;
  const pending = new Map();
  const noise = [];

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { done, fail } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? fail(new Error(JSON.stringify(message.error))) : done(message.result);
      return;
    }
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
      noise.push(`${message.params.type}: ${message.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`);
    }
    if (message.method === 'Runtime.exceptionThrown') {
      noise.push(`exception: ${message.params.exceptionDetails.text}`);
    }
  };

  /**
   * Elke vraag krijgt een deadline. Zonder die deadline hangt het script stil als
   * Chrome een antwoord kwijtraakt — dat gebeurde, en een script dat niets zegt en
   * niet stopt is erger dan een script dat faalt.
   */
  const send = (method, params = {}, ms = 20000) =>
    new Promise((done, fail) => {
      const id = next++;
      const timer = setTimeout(() => {
        pending.delete(id);
        fail(new Error(`${method} gaf geen antwoord binnen ${ms / 1000}s`));
      }, ms);
      pending.set(id, {
        done: (value) => { clearTimeout(timer); done(value); },
        fail: (error) => { clearTimeout(timer); fail(error); },
      });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.text);
    return result.value;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  return { socket, send, evaluate, noise };
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Wat er in de pagina zelf gemeten wordt. Eén blok, zodat het in één keer naar de
 * browser gaat en er geen staat tussen de metingen door kan veranderen.
 */
const MEASURE = `(() => {
  const width = document.documentElement.clientWidth;

  const overflow = [];
  for (const element of document.querySelectorAll('body *')) {
    const box = element.getBoundingClientRect();
    if (box.width === 0 || (box.right <= width + 1 && box.left >= -1)) continue;
    // Een tabel die breder is dan het venster is goed zolang hij in een scrollbaar
    // gebied zit; de kaart is een vaste viewBox en steekt per ontwerp uit.
    if (element.closest('.tablewrap, [role="region"][tabindex]') || element.closest('svg, .stage')) continue;
    overflow.push(element.tagName.toLowerCase() + (typeof element.className === 'string' && element.className ? '.' + element.className.split(' ')[0] : ''));
  }

  const hidden = [...document.querySelectorAll('[data-reveal]')]
    .filter((element) => Number(getComputedStyle(element).opacity) < 0.95)
    .map((element) => (element.id || element.tagName.toLowerCase() + '.' + (typeof element.className === 'string' ? element.className.split(' ')[0] : '')) + ' @' + Math.round(element.getBoundingClientRect().top + window.scrollY));

  const text = document.body.innerText;
  const rot = [
    ...(text.match(/NaN|undefined|Infinity|\\[object \\w+\\]/g) ?? []),
    // Een lege plaatshouder in een zin: "in  the survey was", "( )", "x , y".
    // Lege haakjes tellen alleen als er geen woord voor staat, anders vangt dit
    // elke functienaam in de methodetekst: trend() is geen gat maar een naam.
    ...(text.match(/\\w  +\\w|(?<![A-Za-z0-9_])\\(\\s*\\)|\\w  +[.,]| [.,] /g) ?? []).map((hit) => JSON.stringify(hit)),
  ];

  return {
    overflow: [...new Set(overflow)].slice(0, 8),
    scrolls: document.documentElement.scrollWidth > width + 1,
    hidden,
    rot: [...new Set(rot)].slice(0, 8),
    title: document.title,
    h1: document.querySelector('h1')?.textContent.trim() ?? null,
  };
})()`;

/** Elke link die vanaf de kop zichtbaar is, balk en paneel samen. */
const REACH = `(() => {
  const seen = (element) => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden';
  };
  const links = new Set();
  const collect = (root) => {
    for (const link of root?.querySelectorAll('a') ?? []) if (seen(link)) links.add(link.getAttribute('href'));
  };
  collect(document.querySelector('.nav-shell') ?? document.querySelector('header'));
  document.querySelector('.cat-btn')?.click();
  collect(document.querySelector('#metrics-menu'));
  return [...links];
})()`;

/**
 * De klik waar het menu een dag lang op stukging: niet of het element er staat,
 * maar of een muisklik op dat punt het ook werkelijk raakt.
 */
const AIM = (label, { panel }) => `(() => {
  ${panel ? "document.querySelector('.cat-btn')?.click();" : ''}
  const scope = ${panel ? "document.querySelector('#metrics-menu')" : "document.querySelector('.nav')"};
  const card = [...(scope?.querySelectorAll('a') ?? [])].find((link) => link.textContent.includes(${JSON.stringify(label)}));
  if (!card) return null;
  // Het paneel schuift: een kaart onder de vouw moet eerst in beeld, anders meet je
  // een punt buiten het venster en lijkt elke kaart afgevangen.
  card.scrollIntoView({ block: 'center', behavior: 'instant' });
  const box = card.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return { href: card.getAttribute('href'), blocked: 'niet zichtbaar' };
  const x = Math.round(box.left + box.width / 2);
  const y = Math.round(box.top + box.height / 2);
  const hit = document.elementFromPoint(x, y);
  return {
    x, y,
    href: card.getAttribute('href'),
    blocked: card.contains(hit) || card === hit ? null : (hit ? hit.tagName.toLowerCase() + '.' + (typeof hit.className === 'string' ? hit.className.split(' ')[0] : '') : 'niets'),
  };
})()`;

async function main() {
  const list = await pages();
  if (!list.length) {
    console.error('Geen pagina\'s in dist/. Draai eerst npm run build.');
    process.exit(1);
  }

  const server = await serve();
  const { chrome, url } = await browser();
  const { socket, send, evaluate, noise } = await connect(url);
  if (shots) await mkdir(SHOT_DIR, { recursive: true });

  const views = wanted.length ? DEEP : BROAD;
  const problems = [];
  let checked = 0;

  console.log(`${list.length} pagina('s) × ${views.length} weergave(n) op poort ${PORT}`);

  for (const path of list) {
    for (const view of views) {
      noise.length = 0;
      const where = `${path} ${view.width}px ${view.dark ? 'donker' : 'licht'}`;

      await send('Emulation.setDeviceMetricsOverride', {
        width: view.width, height: view.height, deviceScaleFactor: 1, mobile: view.width < 768,
      });
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-color-scheme', value: view.dark ? 'dark' : 'light' }],
      });
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${path}` });
      await sleep(850);

      // Langzaam naar beneden, zoals een lezer: anders onthult de observer niets.
      const height = await evaluate('document.body.scrollHeight');
      for (let y = 0; y <= height; y += Math.round(view.height * 0.8)) {
        await evaluate(`window.scrollTo(0, ${y})`);
        await sleep(90);
      }
      await sleep(400);
      await evaluate('window.scrollTo(0, 0)');

      const seen = await evaluate(MEASURE);
      checked += 1;
      process.stdout.write(`  ${where}\n`);

      if (seen.hidden.length) problems.push(`${where}: ${seen.hidden.length} blok(ken) blijven onzichtbaar — ${seen.hidden.join(', ')}`);
      if (seen.overflow.length) problems.push(`${where}: steekt buiten het venster — ${seen.overflow.join(', ')}`);
      if (seen.scrolls) problems.push(`${where}: de pagina zelf schuift horizontaal`);
      if (seen.rot.length) problems.push(`${where}: rommel in de tekst — ${seen.rot.join(', ')}`);
      if (!seen.h1) problems.push(`${where}: geen h1`);
      for (const line of noise) problems.push(`${where}: console — ${line}`);

      if (shots) {
        const name = `${path.replaceAll('/', '_') || '_home'}${view.width}-${view.dark ? 'dark' : 'light'}.png`;
        const { data } = await send('Page.captureScreenshot', { format: 'png' });
        await writeFile(join(SHOT_DIR, name), Buffer.from(data, 'base64'));
      }
    }
  }

  /**
   * Het menu, per breedte: raakt een echte muisklik de ingang, en komt hij uit waar
   * de link belooft? Twee ingangen uit het paneel, twee uit de balk zelf — het
   * paneel ving ooit geen enkele klik, en de balk miste ooit de weg naar Notes.
   */
  console.log('  het menu, met een echte muisklik');
  const targets = [
    { label: 'Leaving home', panel: true },
    { label: 'Pension age', panel: true },
    { label: 'How we read it', panel: true },
    { label: 'Notes', panel: false },
    { label: 'Method', panel: false },
  ];
  for (const view of views) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: view.width, height: view.height, deviceScaleFactor: 1, mobile: view.width < 768,
    });

    /**
     * Wat is er vanaf de kop bereikbaar op deze breedte? Smal verdwijnen er links
     * uit de balk, en dan moet het paneel ze dragen. Dat ging al een keer mis: de
     * weg naar de artikelen stond in de balk en die balk is op een telefoon weg.
     */
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${list[0]}` });
    await sleep(800);
    const reach = await evaluate(REACH);
    for (const must of ['/', '/method/', '/notes/']) {
      if (!reach.includes(must)) problems.push(`kop ${view.width}px: ${must} is nergens vanaf de kop te bereiken`);
    }
    checked += 1;

    for (const { label, panel } of targets) {
      // Links die de balk op deze breedte opbergt, test je in het paneel.
      if (!panel && view.width < 768) continue;
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${list[0]}` });
      await sleep(800);
      const where = panel ? 'paneel' : 'balk';
      const aim = await evaluate(AIM(label, { panel }));
      if (!aim) { problems.push(`${where} ${view.width}px: geen ingang voor "${label}"`); continue; }
      if (aim.blocked) { problems.push(`${where} ${view.width}px: "${label}" wordt afgevangen door ${aim.blocked}`); continue; }

      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', {
          type, x: aim.x, y: aim.y, button: 'left', clickCount: 1, buttons: type === 'mousePressed' ? 1 : 0,
        });
      }
      await sleep(800);
      const landed = await evaluate('location.pathname');
      if (landed !== aim.href) problems.push(`${where} ${view.width}px: "${label}" wijst naar ${aim.href} maar klikken bracht ons op ${landed}`);
      checked += 1;
    }
  }

  socket.close();
  chrome.kill();
  server.close();

  console.log(`\n${list.length} pagina('s), ${views.length} weergave(n), ${checked} controles${shots ? `, afdrukken in dist-shots/` : ''}`);
  if (problems.length) {
    console.error(`\n${problems.length} probleem(en):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log('\nAlles in orde.\n');
}

await main();
