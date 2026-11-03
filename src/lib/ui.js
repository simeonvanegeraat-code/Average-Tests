/**
 * De taalgrens voor vaste tekst: koppen, menu, knoppen, labels, aria-teksten.
 *
 * Derde van drie grenzen, naast `country-names.js` voor landnamen en `metric-names.js`
 * voor metriekwoorden. Alle drie doen hetzelfde: het woord komt op zijn plek vóórdat
 * iets het leest, zodat de leesplekken niet verbouwd hoeven worden.
 *
 * Hier is dat anders ingevuld dan bij die twee, en met reden. Een landnaam zit ín de
 * data en een metriekwoord ín een configuratie, dus daar kon de grens een object
 * omwisselen. Vaste tekst staat in het sjabloon zelf, dus daar moet de pagina hem
 * ophalen: `const t = ui(lang).shell` bovenaan, en `{t.skipToContent}` in de HTML.
 *
 * WAT HIER NIET IN HOORT
 *
 * Een zin met een getal of een landnaam erin. "From {fmt(a)} in {withArticle(b)} to …"
 * is Engelse woordorde met gaten, en die woordorde is precies wat per taal verandert.
 * Zo'n zin in een woordenbestand zetten geeft een sjabloon dat in het Nederlands niet
 * werkt. Die horen bij de zinsbouwers van stap 3.
 *
 * Gemeten op 3 november 2026: 560 fragmenten vaste tekst in de .astro-bestanden, en
 * 488 zinnen met data erin. De tweede groep komt hier dus niet.
 *
 * EEN ONTBREKENDE SLEUTEL VALT TERUG OP DE STANDAARDTAAL
 *
 * `ui('nl')` geeft het Nederlandse bestand óver het Engelse heen. Een sleutel die in het
 * Nederlands nog niet bestaat, levert daarom de Engelse tekst op en geen `undefined` —
 * want `undefined` in een sjabloon is een lege kop, en een lege kop is erger dan een
 * Engelse. `validate-i18n.mjs` is de plek die het gat hoort te melden.
 */
import { DEFAULT_LOCALE } from './locales.js';
/** Met `with { type: 'json' }`, zodat plain Node deze grens kan testen. Zie country-names.js. */
import en from '../locales/en/ui.json' with { type: 'json' };
import nl from '../locales/nl/ui.json' with { type: 'json' };

/**
 * Eén bestand per taal. Een taal erbij is de import hierboven en een sleutel hier, en
 * `validate-i18n.mjs` vergelijkt deze sleutels met LOCALES — want een taal die hier
 * niet staat krijgt zwijgend het Engels.
 */
const TEXT = { en, nl };

/** Welke talen hier vaste tekst hebben. Alleen voor de poort. */
export const UI_LANGUAGES = Object.keys(TEXT);

/** Het ruwe bestand van één taal, zonder terugval. Alleen voor de poort. */
export const uiRaw = (lang) => TEXT[lang];

function merge(base, over) {
  const out = { ...base };
  for (const [key, value] of Object.entries(over ?? {})) {
    out[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? merge(base?.[key] ?? {}, value)
        : value;
  }
  return out;
}

/**
 * Eén keer samenvoegen per taal, niet per pagina.
 *
 * Astro rendert tijdens één build tientallen pagina's in één proces, en die vragen
 * allemaal dezelfde taal. Zonder deze cache wordt hetzelfde object veertig keer
 * opgebouwd. Een Map op taal en niet een losse variabele: een variabele met "de
 * huidige taal" is de stilste bug die deze site kan hebben, zoals `format.js` uitlegt.
 */
/**
 * Een zin met gaten erin vullen: fill(t.averageVsMedian, { multiple: '3,5×' }).
 *
 * Dit bestaat omdat de zinnen op de metriekpagina's geen tekst zijn maar tekst mét een
 * berekening erin: "The average is {multiple} the median". Zo'n zin kan niet als kale
 * string in een woordenbestand, en een zinsbouwer per pagina is ervoor te zwaar: er zit
 * geen opmaak om die getallen heen, alleen tekst eromheen. Waar de nadruk wél ín de zin
 * valt, blijft de stukkenvorm van src/locales/<taal>/copy/ het juiste gereedschap.
 *
 * Een gat dat niet gevuld wordt blijft staan als {naam}, zichtbaar op de pagina. Dat is
 * met opzet: een stille lege plek in een zin leest als een zin, en een zichtbaar gat
 * niet. Zo vindt de eerste blik hem, en niet de bezoeker.
 */
export const fill = (template, values = {}) =>
  String(template ?? "").replace(/\{(\w+)\}/g, (hit, naam) =>
    values[naam] === undefined ? hit : String(values[naam]),
  );
const cache = new Map();

export function ui(lang = DEFAULT_LOCALE) {
  let found = cache.get(lang);
  if (!found) {
    found = lang === DEFAULT_LOCALE ? TEXT[DEFAULT_LOCALE] : merge(TEXT[DEFAULT_LOCALE], TEXT[lang]);
    cache.set(lang, found);
  }
  return found;
}
