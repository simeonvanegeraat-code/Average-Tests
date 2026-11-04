/**
 * De artikelen op /notes/.
 *
 * Eén regel per stuk. De balk, het mega menu, de voet en de overzichtspagina lezen
 * hieruit, zodat een nieuw artikel vanzelf overal verschijnt en er nooit meer een
 * pagina staat waar vanaf de rest van de site geen route naartoe loopt.
 *
 * In `teaser` staan bewust geen cijfers. Elk getal op deze site komt uit de data
 * (regel 5 in CLAUDE.md), en een samenvatting die met de hand "17,5" noemt is
 * precies het achtergebleven getal dat niemand ziet als Eurostat bijpubliceert.
 * De cijfers staan in het artikel zelf, waar ze uit `break-story.js` komen.
 *
 * Nieuw artikel toevoegen: een regel hier en een bestand in `src/pages/notes/`.
 * De nieuwste bovenaan.
 */

import { monthName } from './period.js';
import { DEFAULT_LOCALE } from './locales.js';

/**
 * De tekst van een artikel staat per taal, want dit is redactie en geen label.
 *
 * Tot 4 november 2026 stond `NOTES` als moduleconstante met alleen Engels erin, en dat
 * stond dus ook op /nl/, in het megamenu, in de voet en op /nl/notes/. Zelfde fout als
 * CATALOGUE, METHODOLOGY en related.js hadden: wat op moduleniveau staat kan geen taal
 * kennen.
 *
 * De Nederlandse kop is geen vertaling van de Engelse. "Why you cannot compare Eurostat
 * figures across 2021" is een bewering; het Nederlands wordt sterker als het de vraag
 * stelt die de lezer zelf heeft.
 */
const ENTRIES = [
  {
    slug: 'eurostat-2021-series-break',
    path: '/notes/eurostat-2021-series-break/',
    /** De tint van de metriek waar het artikel over gaat, uit STAGES in hue.js. */
    hue: 262,
    published: '2026-10-25',
    text: {
      en: {
        /** De volledige kop, voor de overzichtspagina en de voet. */
        title: 'Why you cannot compare Eurostat figures across 2021',
        /** Kort genoeg voor een kaart in het mega menu. */
        card: 'Why 2021 breaks the series',
        teaser:
          'The European Labour Force Survey was rebuilt in 2021, and almost every series ' +
          'breaks there. Eurostat flags it, but a flag does not stop anyone drawing a line ' +
          'straight through it. What that does to a chart, and why a footnote was not enough.',
      },
      nl: {
        title: 'Waarom je Eurostat-cijfers niet over 2021 heen kunt vergelijken',
        card: 'Waarom 2021 de reeks breekt',
        teaser:
          'De Europese arbeidskrachtenenquête is in 2021 opnieuw opgebouwd, en vrijwel elke ' +
          'reeks breekt daar. Eurostat markeert dat, maar een markering houdt niemand tegen ' +
          'die er een lijn door trekt. Wat dat met een grafiek doet, en waarom een voetnoot ' +
          'niet genoeg was.',
      },
    },
  },
];

/**
 * De artikelen in één taal, met hun tekst al op zijn plek.
 *
 * Een taal zonder eigen tekst valt terug op de standaardtaal — een Engelse kop is beter
 * dan een lege, en `validate-i18n.mjs` is de plek die het gat hoort te melden.
 */
const perLang = new Map();

export function notes(lang = DEFAULT_LOCALE) {
  let found = perLang.get(lang);
  if (!found) {
    found = ENTRIES.map(({ text, ...rest }) => ({ ...rest, ...(text[lang] ?? text[DEFAULT_LOCALE]) }));
    perLang.set(lang, found);
  }
  return found;
}

/** Waar "Notes" in de balk en in het paneel heen wijst. */
export const NOTES_LINK = '/notes/';

/** "2026-10-25" wordt "25 October 2026". */
export function noteDate(iso, { locale } = {}) {
  const [year, month, day] = String(iso).split('-').map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${monthName(month, { locale })} ${year}`;
}
