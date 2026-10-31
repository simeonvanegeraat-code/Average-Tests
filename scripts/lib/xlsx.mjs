/**
 * Een zip en een xlsx uitlezen met alleen `node:zlib`. Geen dependency.
 *
 * Dit bestaat omdat de ECB zijn HFCS-tabellen niet via een API publiceert maar als
 * zip met één xlsx erin. Een xlsx ís een zip, dus dezelfde lezer werkt twee niveaus
 * diep: zip → xlsx → de XML-onderdelen daarbinnen.
 *
 * Twee dingen waar de eerste poging stilletjes op stukging, en waarom ze hier
 * vastliggen in plaats van in een opmerking:
 *
 * 1. **Zelfsluitende cellen.** Een lege cel met opmaak schrijft Excel als
 *    `<c r="A5" s="8"/>`, zonder `</c>`. Een regex die altijd een sluittag verwacht
 *    koppelt die aan de volgende cel, slikt alles ertussen op en schuift de hele rij
 *    een kolom op. Het gaf geen fout: het gaf de verkeerde landen bij de verkeerde
 *    cijfers.
 * 2. **Getallen als tekst.** De HFCS-tabellen zetten "24.6" in de gedeelde
 *    tekstentabel in plaats van als getal in de cel. Een lezer die alleen `<v>` als
 *    getal leest krijgt dan het índexnummer van die tekst terug — 1243 in plaats van
 *    24,6. Ook dat valt niet om, het liegt alleen.
 *
 * Alles komt er als tekst uit. Omrekenen naar een getal is aan de aanroeper, want
 * een lege cel is iets anders dan een nul en alleen die weet welke van de twee hier
 * mag voorkomen.
 */
import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

/**
 * De bestanden in een zip, uitgepakt. Leest de centrale directory achteraan en loopt
 * die af; dat is betrouwbaarder dan de lokale kopjes vooraan, die bij gestreamde zips
 * hun maten pas achteraf invullen.
 */
export function zipEntries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 70000; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Geen zip: einde van de centrale directory niet gevonden.');

  const aantal = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const uit = new Map();

  for (let n = 0; n < aantal; n += 1) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const methode = buf.readUInt16LE(off + 10);
    const gepakt = buf.readUInt32LE(off + 20);
    const naamLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commLen = buf.readUInt16LE(off + 32);
    const lokaal = buf.readUInt32LE(off + 42);
    const naam = buf.toString('utf8', off + 46, off + 46 + naamLen);

    if (methode !== 0 && methode !== 8) {
      throw new Error(`${naam}: compressiemethode ${methode} wordt niet ondersteund (alleen opslaan en deflate).`);
    }

    // De lokale kop herhaalt naam en extra-veld, en die lengtes kunnen afwijken van
    // die in de directory. De data begint er direct achter.
    const start = lokaal + 30 + buf.readUInt16LE(lokaal + 26) + buf.readUInt16LE(lokaal + 28);
    const rauw = buf.subarray(start, start + gepakt);
    uit.set(naam, methode === 8 ? inflateRawSync(rauw) : Buffer.from(rauw));

    off += 46 + naamLen + extraLen + commLen;
  }

  return uit;
}

const ontsnap = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');

/**
 * Een xlsx openen: de gedeelde teksten en de lijst tabbladen met hun pad.
 *
 * @param pad  pad naar het .xlsx-bestand, of een Buffer die er al is
 */
export async function openWorkbook(pad) {
  const buf = Buffer.isBuffer(pad) ? pad : await readFile(pad);
  const boek = zipEntries(buf);

  const ss = boek.get('xl/sharedStrings.xml')?.toString('utf8') ?? '';
  const strings = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    // Opgemaakte tekst staat als meerdere <t>-stukken in één <si>; aan elkaar plakken.
    ontsnap([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
  );

  const wb = boek.get('xl/workbook.xml')?.toString('utf8');
  if (!wb) throw new Error('Geen xl/workbook.xml: dit is geen xlsx.');
  const rels = boek.get('xl/_rels/workbook.xml.rels')?.toString('utf8') ?? '';
  const relMap = new Map([...rels.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((m) => [m[1], m[2]]));

  const sheets = [...wb.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]*)"/g)].map((m) => ({
    naam: ontsnap(m[1]),
    pad: `xl/${(relMap.get(m[2]) ?? '').replace(/^\//, '')}`,
  }));

  return { boek, strings, sheets };
}

/** Het tabblad waarvan de naam met `prefix` begint. Gooit als het er niet is. */
export function sheetByPrefix(workbook, prefix) {
  const blad = workbook.sheets.find((s) => s.naam.startsWith(prefix));
  if (!blad) {
    throw new Error(`Geen tabblad dat begint met "${prefix}". Aanwezig: ${workbook.sheets.map((s) => s.naam).join(', ')}`);
  }
  return blad;
}

/**
 * Eén tabblad als rechthoekige matrix van strings. Lege cellen zijn een lege string
 * en geen gat, zodat `map` en `slice` erop werken zoals je verwacht.
 */
export function readSheet(workbook, sheetPad) {
  const xml = workbook.boek.get(sheetPad)?.toString('utf8');
  if (!xml) throw new Error(`Tabblad ${sheetPad} zit niet in het bestand.`);

  const rijen = [];
  let breedte = 0;

  for (const r of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const nr = Number(r[1]);
    const cellen = [];

    for (const c of (r[2] ?? '').matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const type = /\bt="([^"]+)"/.exec(c[2])?.[1];
      const inhoud = c[3] ?? '';
      const v = /<v>([\s\S]*?)<\/v>/.exec(inhoud)?.[1];
      const inline = /<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/.exec(inhoud)?.[1];

      let waarde = '';
      if (type === 's' && v !== undefined) waarde = sharedString(workbook, Number(v));
      else if (type === 'inlineStr' && inline !== undefined) waarde = ontsnap(inline);
      else if (v !== undefined) waarde = v;

      let kolom = 0;
      for (const ch of c[1]) kolom = kolom * 26 + (ch.charCodeAt(0) - 64);
      cellen[kolom - 1] = waarde;
      if (kolom > breedte) breedte = kolom;
    }

    rijen[nr - 1] = cellen;
  }

  return Array.from({ length: rijen.length }, (_, i) =>
    Array.from({ length: breedte }, (_, j) => rijen[i]?.[j] ?? ''),
  );
}

function sharedString(workbook, index) {
  const s = workbook.strings[index];
  if (s === undefined) {
    throw new Error(`Gedeelde tekst ${index} bestaat niet (${workbook.strings.length} stuks). Het bestand is anders van vorm dan verwacht.`);
  }
  return s;
}
