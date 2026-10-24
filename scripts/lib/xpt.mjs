// Reader voor SAS Transport v5 (.xpt), het formaat waarin NHANES microdata publiceert.
// Geen dependencies. Zie NCHS/SAS TS-140 voor de formaatbeschrijving.

const REC = 80;
const ascii = (buf, from, len) => buf.toString('latin1', from, from + len);

/**
 * IBM 360 hexadecimale float -> IEEE double.
 * waarde = teken * (mantisse / 2^56) * 16^(exponent - 64)
 * Missende waarden zijn '.', '_' of 'A'-'Z' in byte 0 met de rest op nul.
 */
function ibmToDouble(buf, offset, length) {
  const b = Buffer.alloc(8, 0);
  buf.copy(b, 0, offset, offset + length);

  let restZero = true;
  for (let i = 1; i < 8; i++) {
    if (b[i] !== 0) { restZero = false; break; }
  }
  if (restZero) {
    const c = b[0];
    if (c === 0x00) return 0;
    if (c === 0x2e || c === 0x5f || (c >= 0x41 && c <= 0x5a)) return null; // . _ A-Z
  }

  const sign = (b[0] & 0x80) ? -1 : 1;
  const exponent = (b[0] & 0x7f) - 64;
  let mantissa = 0;
  for (let i = 1; i < 8; i++) mantissa = mantissa * 256 + b[i];

  return sign * mantissa * Math.pow(16, exponent) / Math.pow(2, 56);
}

function parseNamestr(buf, offset) {
  return {
    type: buf.readInt16BE(offset),            // 1 = numeriek, 2 = tekst
    length: buf.readInt16BE(offset + 4),
    varnum: buf.readInt16BE(offset + 6),
    name: ascii(buf, offset + 8, 8).trim(),
    label: ascii(buf, offset + 16, 40).trim(),
    position: buf.readInt32BE(offset + 84),
  };
}

export function readXpt(buf) {
  const LIB = 'HEADER RECORD*******LIBRARY HEADER RECORD!!!!!!!';
  if (ascii(buf, 0, LIB.length) !== LIB) {
    throw new Error('Geen SAS Transport v5 bestand: library header ontbreekt.');
  }

  let pos = REC * 3; // library header + symbool- en datumrecord

  const memberHeader = ascii(buf, pos, REC);
  if (!memberHeader.startsWith('HEADER RECORD*******MEMBER')) {
    throw new Error(`Member header niet gevonden op offset ${pos}.`);
  }
  // De namestr-recordlengte staat in de member header (v5: 140).
  const namestrSize = parseInt(memberHeader.slice(74, 78), 10);
  if (namestrSize !== 140) {
    throw new Error(`Onverwachte namestr-lengte ${namestrSize}; deze lezer ondersteunt alleen v5 (140).`);
  }
  pos += REC;

  if (!ascii(buf, pos, REC).startsWith('HEADER RECORD*******DSCRPTR')) {
    throw new Error(`Dscrptr header niet gevonden op offset ${pos}.`);
  }
  pos += REC;

  const datasetName = ascii(buf, pos + 8, 8).trim(); // "SAS     DEMO_J  SASDATA ..."
  pos += REC;   // member descriptor
  pos += REC;   // aanmaak-/wijzigingsdatum

  const nsHeader = ascii(buf, pos, REC);
  if (!nsHeader.startsWith('HEADER RECORD*******NAMESTR HEADER RECORD')) {
    throw new Error(`Namestr header niet gevonden op offset ${pos}.`);
  }
  const varCount = parseInt(nsHeader.slice(54, 58), 10);
  if (!Number.isInteger(varCount) || varCount <= 0) {
    throw new Error(`Onleesbaar aantal variabelen in namestr header: "${nsHeader.slice(48, 58)}"`);
  }
  pos += REC;

  const vars = [];
  for (let i = 0; i < varCount; i++) vars.push(parseNamestr(buf, pos + i * namestrSize));

  // namestr-blok is opgevuld tot een veelvoud van 80
  pos += Math.ceil((varCount * namestrSize) / REC) * REC;

  if (!ascii(buf, pos, REC).startsWith('HEADER RECORD*******OBS')) {
    throw new Error(`Obs header niet gevonden op offset ${pos}.`);
  }
  pos += REC;

  const rowLength = vars.reduce((sum, v) => sum + v.length, 0);
  const rows = [];

  for (let off = pos; off + rowLength <= buf.length; off += rowLength) {
    // De laatste blokken zijn met spaties opgevuld tot een veelvoud van 80.
    let allSpaces = true;
    for (let i = 0; i < rowLength; i++) {
      if (buf[off + i] !== 0x20) { allSpaces = false; break; }
    }
    if (allSpaces) break;

    const row = {};
    for (const v of vars) {
      const at = off + v.position;
      row[v.name] = v.type === 1
        ? ibmToDouble(buf, at, v.length)
        : ascii(buf, at, v.length).trim();
    }
    rows.push(row);
  }

  return { datasetName, vars, rows };
}
