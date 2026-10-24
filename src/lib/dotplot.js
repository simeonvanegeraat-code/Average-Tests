/**
 * Indeling van de stippengrafiek (src/components/DotPlot.astro): elk land een stip op
 * een as met het getal, jouw land licht op.
 *
 * Alles wordt op de server uitgerekend, in procenten van de breedte, zodat de grafiek
 * zonder JavaScript staat en op elke breedte scherp blijft: stippen en labels hebben
 * een vaste grootte in pixels, alleen hun plek is een percentage.
 *
 * Eén aanname bepaalt de stapeling: de grafiek mag nergens overlappen op de smalste
 * breedte die we ondersteunen (REF_WIDTH). Op een bredere weergave is er dan meer
 * ruimte dan nodig, en dat is geen probleem; het omgekeerde zou het wel zijn.
 */

/** Smalste breedte van de grafiek in pixels waarop niets mag overlappen: een scherm van 320 px, min 2 × 16 px marge van de pagina, min 2 × 18 px opvulling van het donkere paneel. */
export const REF_WIDTH = 252;

/** Marge links en rechts, in procenten van de breedte. */
export const PAD = 4;

/** Doorsnede van een stip en de ruimte ertussen, in pixels. Staat ook in public/css/ha.css (`.dp`). */
export const DOT = 12;
export const GAP = 2;

/** Breedte van een label: ± 7 px per teken plus opvulling, in pixels. */
const labelWidth = (text) => text.length * 7 + 22;

/** De as loopt van het laagste hele getal onder de laagste waarde tot het hoogste erboven. */
export function axisRange(values) {
  return { lo: Math.floor(Math.min(...values)) - 1, hi: Math.ceil(Math.max(...values)) + 1 };
}

/** Plek op de as, in procenten van de breedte. */
export function xOf(value, { lo, hi }) {
  return PAD + ((value - lo) / (hi - lo)) * (100 - 2 * PAD);
}

/** Streepjes op de as: de kleinste stap waarbij twee streepjes minstens 40 px uit elkaar liggen. */
export function ticks({ lo, hi }) {
  const span = ((100 - 2 * PAD) / 100) * REF_WIDTH;
  const step = [1, 2, 3, 4, 5, 10].find((s) => (s / (hi - lo)) * span >= 40) ?? 10;
  const out = [];
  for (let value = Math.ceil(lo / step) * step; value <= hi; value += step) {
    out.push({ value, x: xOf(value, { lo, hi }) });
  }
  return out;
}

/**
 * Stapelt de stippen: van links naar rechts, elke stip in de laagste rij waar de
 * vorige stip in die rij ver genoeg weg staat. `items` zijn `{ code, name, total }`.
 * Geeft dezelfde items terug met `x` (procent) en `row` (0 is de onderste rij).
 */
export function stackDots(items, range) {
  const spacing = ((DOT + GAP) / (REF_WIDTH * ((100 - 2 * PAD) / 100))) * (100 - 2 * PAD);
  const lastX = [];
  return [...items]
    .sort((a, b) => a.total - b.total)
    .map((item) => {
      const x = xOf(item.total, range);
      let row = 0;
      while (lastX[row] !== undefined && x - lastX[row] < spacing) row += 1;
      lastX[row] = x;
      return { ...item, x, row };
    });
}

/**
 * Plaatst labels in rijen boven de stippen, zodat ze elkaar niet raken. `labels` zijn
 * `{ x, text, kind }`; `dot` (optioneel) is de stip waar het label naar wijst.
 * Het label zelf blijft binnen de grafiek (`lx`), de geleidelijn gaat recht naar de stip (`x`).
 */
export function placeLabels(labels) {
  const rightEdge = [];
  const placed = [...labels]
    .sort((a, b) => a.x - b.x)
    .map((label) => {
      const half = (labelWidth(label.text) / 2 / REF_WIDTH) * 100;
      const lx = labelX(label.x, label.text);
      let row = 0;
      while (rightEdge[row] !== undefined && rightEdge[row] > lx - half - 1) row += 1;
      rightEdge[row] = lx + half;
      return { ...label, lx, row };
    });
  return { labels: placed, rows: rightEdge.length };
}

/** Plek van een label: onder de stip waar het naar wijst, maar nooit buiten de grafiek. */
export function labelX(x, text) {
  const half = (labelWidth(text) / 2 / REF_WIDTH) * 100;
  return Math.min(Math.max(x, half + 1), 100 - half - 1);
}
