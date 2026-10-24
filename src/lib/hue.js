/**
 * Kleur voor de nieuwe vormtaal (public/css/ha.css): één tint per metriek.
 *
 * Elke metriek op de levenslijn krijgt een eigen hue, en alles wat bij die metriek
 * hoort (kaartklassen, grote getal, kaartjes, deelbeeld) leest die ene waarde. De
 * kaartschaal wordt hier op de server uitgerekend, om twee redenen die CSS niet
 * kan oplossen:
 *
 * 1. Welke tekstkleur op een kaartklasse leesbaar is hangt af van het contrast, en
 *    CSS kan geen contrast uitrekenen. Per klasse kiezen we wit of donkere inkt,
 *    wat het meeste contrast geeft. Zo zit er geen handmatige keuze in die voor
 *    de ene tint klopt en voor de andere niet (groen en cyaan zaten bij mijn eerste
 *    schaal net onder 4,5:1; dat is de reden voor de gekozen helderheden).
 * 2. Het deelbeeld is een losse SVG zonder CSS-variabelen en heeft echte
 *    kleurwaarden nodig.
 *
 * Alles is OKLCH met chroma-reductie tot binnen sRGB. De helderheidsstappen zijn
 * bewust gelijk voor elke tint; alleen de hue verschilt.
 */

const encode = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
const clamp = (x) => Math.min(1, Math.max(0, x));

function linear(L, C, hue) {
  const h = (hue * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** OKLCH naar `#rrggbb`. Valt de kleur buiten sRGB, dan gaat er chroma af tot hij erbinnen valt. */
export function oklchHex(L, C, hue) {
  let chroma = C;
  let rgb = linear(L, chroma, hue);
  for (let i = 0; i < 80 && !rgb.every((v) => v >= -0.0005 && v <= 1.0005); i += 1) {
    chroma -= 0.003;
    rgb = linear(L, Math.max(0, chroma), hue);
  }
  return `#${rgb
    .map((v) =>
      Math.round(clamp(encode(clamp(v))) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** De vijf stops van de levenslijn. De volgorde is de volgorde van het spectrum in logo en footer. */
export const STAGES = { leave: 262, marry: 350, child: 50, retire: 145, healthy: 205 };

/** Zes klassen, zelfde helderheids- en chromastappen voor elke tint, hue schuift licht mee. */
const RAMP = {
  lightness: [0.34, 0.45, 0.54, 0.67, 0.78, 0.89],
  chroma: [0.07, 0.12, 0.17, 0.19, 0.15, 0.08],
  hueShift: [-6, 0, 6, 14, 24, 36],
};

/** Donkere inkt voor tekst op de lichte klassen; gelijk aan het donkere vlak van de vormtaal. */
export const INK = oklchHex(0.18, 0.03, 268);

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG-contrastverhouding tussen twee `#rrggbb`-kleuren. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** De zes kaartkleuren voor een tint, van vroeg naar laat. */
export function rampFor(hue) {
  return RAMP.lightness.map((l, i) => oklchHex(l, RAMP.chroma[i], hue + RAMP.hueShift[i]));
}

/** Per klasse wit of donkere inkt, wat het meeste contrast geeft. */
export function labelColors(ramp) {
  return ramp.map((hex) => (contrast('#ffffff', hex) >= contrast(INK, hex) ? '#ffffff' : INK));
}

/**
 * De waarde voor het `style`-attribuut op `<html>`: de tint, de zes kaartkleuren
 * (`--r0` t/m `--r5`) en de bijbehorende tekstkleuren (`--rt0` t/m `--rt5`).
 */
export function hueStyle(hue) {
  const ramp = rampFor(hue);
  const text = labelColors(ramp);
  return [
    `--h:${hue}`,
    ...ramp.map((hex, i) => `--r${i}:${hex}`),
    ...text.map((hex, i) => `--rt${i}:${hex}`),
  ].join(';');
}

/** Het spectrum van de levenslijn als zes hexwaarden-lijst voor logo, favicon en deelbeeld. */
export function spectrum() {
  const lightness = [0.74, 0.74, 0.76, 0.8, 0.8];
  const chroma = [0.17, 0.17, 0.16, 0.16, 0.13];
  return Object.values(STAGES).map((hue, i) => oklchHex(lightness[i], chroma[i], hue));
}
