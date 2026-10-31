/**
 * Perioden die geen jaar zijn.
 *
 * Tot `une_rt_m` publiceerde elke bron achter deze site één cijfer per jaar, en dan is
 * een periode gewoon een getal: "2025" sorteert, rekent en leest. Werkloosheid komt per
 * maand ("2026-08"), en daar valt dat alle drie uit elkaar. `Number('2026-08')` is NaN,
 * dus een tijdas die op jaartallen rekent tekent niets — geen foutmelding, een leeg
 * lijntje.
 *
 * Twee dingen staan hier, en verder niets: de plek van een periode op een tijdas, en
 * zijn naam in een zin.
 *
 * `formatPeriod()` in src/lib/wealth.js doet het laatste al voor de kwartalen van de
 * ECB. Die blijft staan: de vermogenspagina's hangen eraan, en één van de twee
 * weghalen is een verbouwing die niet bij deze pagina hoort.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-08" naar `{ year: 2026, month: 8 }`, "2026-Q2" naar `{ year: 2026, quarter: 2 }`. */
function parse(period) {
  const text = String(period);
  const month = /^(\d{4})-(\d{2})$/.exec(text);
  if (month) return { year: Number(month[1]), month: Number(month[2]) };

  const quarter = /^(\d{4})-Q([1-4])$/.exec(text);
  if (quarter) return { year: Number(quarter[1]), quarter: Number(quarter[2]) };

  const year = /^(\d{4})$/.exec(text);
  return year ? { year: Number(year[1]) } : null;
}

/**
 * De plek van een periode op een tijdas, uitgedrukt in jaren.
 *
 * "2026" wordt 2026, "2026-Q2" wordt 2026,25 en "2026-08" wordt 2026,583: elke maand
 * krijgt het begin van zijn eigen vak, zodat twee opeenvolgende waarnemingen overal
 * dezelfde afstand hebben. Een getal gaat ongemoeid door, want de jaarreeksen gaven
 * hun jaar al als getal mee.
 *
 * Geeft NaN terug bij iets wat geen periode is. Dat is bewust hetzelfde gedrag als
 * `Number()`: de aanroeper rekent ermee, en een stille 0 zou een punt op het jaar nul
 * zetten in plaats van het lijntje weg te laten.
 */
export function periodNumber(period) {
  if (typeof period === 'number') return period;
  const parts = parse(period);
  if (!parts) return Number.NaN;
  if (parts.month) return parts.year + (parts.month - 1) / 12;
  if (parts.quarter) return parts.year + (parts.quarter - 1) / 4;
  return parts.year;
}

/** "2026-08" naar "August 2026", "2026-Q2" naar "Q2 2026", "2026" naar "2026". */
export function periodLabel(period) {
  const parts = parse(period);
  if (!parts) return String(period ?? '');
  if (parts.month) return `${MONTHS[parts.month - 1]} ${parts.year}`;
  if (parts.quarter) return `Q${parts.quarter} ${parts.year}`;
  return String(parts.year);
}

/** Dezelfde naam, afgekort: "Aug 2026". Voor een tabelkop, waar de volle naam niet past. */
export function periodShort(period) {
  const parts = parse(period);
  if (!parts) return String(period ?? '');
  if (parts.month) return `${MONTHS[parts.month - 1].slice(0, 3)} ${parts.year}`;
  if (parts.quarter) return `Q${parts.quarter} ${parts.year}`;
  return String(parts.year);
}

/**
 * Hoe fijn een reeks is: 'month', 'quarter' of 'year'.
 *
 * Een pagina die zegt "een jaartal naast een land betekent dat er geen cijfer van 2026
 * is" moet bij een maandreeks "maand" zeggen, anders klopt de zin niet meer. De tabel
 * leest dit uit de nieuwste periode in plaats van het per pagina te laten instellen.
 */
export function periodUnit(period) {
  const parts = parse(period);
  if (!parts) return 'year';
  if (parts.month) return 'month';
  if (parts.quarter) return 'quarter';
  return 'year';
}
