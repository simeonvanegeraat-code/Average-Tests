/**
 * De taalgrens voor de woorden van een metriek.
 *
 * Tweelingbroer van `country-names.js`, en om dezelfde reden gebouwd. De woorden van een
 * metriek — "Earliest", "years", "under 22", "Age you left home" — worden door de
 * componenten op tientallen plekken gelezen als `metric.words.low`, `metric.unit`,
 * `band.label`. Die plekken verbouwen voor een tweede taal is geen optie, dus gebeurt het
 * hier: één functie die de woorden invult vóórdat een component het object ziet.
 *
 * Wat er daardoor **niet** verandert: geen enkele `metric.words.*` in `StageMap`,
 * `RankTable`, `StatHero`, `FactsBento` of een pagina. Dat is het verschil tussen een
 * middag en een week, en het is dezelfde keuze als bij de landnamen.
 *
 * WAAR DE TAAL VANDAAN KOMT
 *
 * Niet uit een modulevariabele. Astro rendert tijdens één build meerdere pagina's in één
 * proces, dus een "huidige taal" die tussen pagina's blijft staan levert een pagina in de
 * verkeerde taal op — de stilste bug die deze site kan hebben. `format.js` legt dat
 * uitgebreider uit. De taal komt dus als argument, van de pagina die hem uit zijn eigen
 * pad leest.
 *
 * WAT DEZE FUNCTIE NIET DOET
 *
 * Een ontbrekend woord leegmaken. Staat een metriek of een sleutel niet in het
 * woordenbestand, dan blijft het woord uit `src/lib/metrics/` staan — het Engelse woord is
 * beter dan een lege legenda, en `validate-i18n.mjs` is de plek die een gat hoort te
 * melden. Een gat dat zichtbaar wordt op de pagina is een gat dat te laat gevonden is.
 *
 * Ook raakt deze functie `decimals`, `hue`, `path`, `key`, `until`, `min`, `max` en `step`
 * niet aan. Dat zijn geen woorden, en een getal dat per taal verschilt zou betekenen dat
 * de Nederlandse kaart andere klassegrenzen heeft dan de Engelse.
 */
import { DEFAULT_LOCALE } from './locales.js';
/** Met `with { type: 'json' }`, zodat plain Node deze grens kan testen. Zie country-names.js. */
import en from '../locales/en/metrics.json' with { type: 'json' };
import nl from '../locales/nl/metrics.json' with { type: 'json' };

/**
 * Eén woordenbestand per taal. Een taal erbij is de import hierboven en een sleutel hier,
 * en `validate-i18n.mjs` vergelijkt deze sleutels met LOCALES — want een taal met een
 * compleet woordenbestand dat hier niet staat, krijgt zwijgend het Engels. Dat is op
 * 1 november precies één keer gebeurd met de landnamen, en één keer is genoeg.
 */
const WORDS = { en, nl };

export function metricWords(lang) {
  return WORDS[lang] ?? WORDS[DEFAULT_LOCALE];
}

/** Welke talen hier een woordenbestand hebben. Alleen voor de poort. */
export const METRIC_LANGUAGES = Object.keys(WORDS);

/**
 * Een metriekbeschrijving met de woorden in de gevraagde taal.
 *
 * Geeft een nieuw object terug en laat het ingelezen bestand ongemoeid: die module is
 * tussen pagina's gedeeld, en erin schrijven zou de ene pagina de taal van de andere
 * geven.
 *
 * De lenzen worden op hun `key` opgezocht en niet op hun plek in de lijst, want die
 * sleutel is stabiel en de volgorde niet. De klasselabels wél op hun plek: de zes
 * klassen zíjn een geordende reeks, en `validate-i18n.mjs` controleert dat het label op
 * plek i de grenzen van klasse i noemt.
 */
export function localiseMetric(metric, lang = DEFAULT_LOCALE) {
  const all = metricWords(lang);
  const words = all[metric.key];
  if (!words) return metric;

  const out = { ...metric };

  for (const key of ['label', 'unit', 'unitOne', 'unitShort']) {
    if (words[key] !== undefined) out[key] = words[key];
  }

  if (Array.isArray(words.bands)) {
    out.bands = metric.bands.map((band, i) =>
      words.bands[i] === undefined ? band : { ...band, label: words.bands[i] },
    );
  }

  if (words.lenses) {
    out.lenses = metric.lenses.map((lens) => {
      const found = words.lenses[lens.key];
      return found ? { ...lens, ...found } : lens;
    });
  }

  if (words.words) out.words = { ...metric.words, ...words.words };
  if (words.input && metric.input) out.input = { ...metric.input, ...words.input };

  return out;
}
