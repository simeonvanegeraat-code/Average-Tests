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
export const NOTES = [
  {
    slug: 'eurostat-2021-series-break',
    path: '/notes/eurostat-2021-series-break/',
    /** De volledige kop, voor de overzichtspagina en de voet. */
    title: 'Why you cannot compare Eurostat figures across 2021',
    /** Kort genoeg voor een kaart in het mega menu. */
    card: 'Why 2021 breaks the series',
    teaser:
      'The European Labour Force Survey was rebuilt in 2021, and almost every series ' +
      'breaks there. Eurostat flags it, but a flag does not stop anyone drawing a line ' +
      'straight through it. What that does to a chart, and why a footnote was not enough.',
    /** De tint van de metriek waar het artikel over gaat, uit STAGES in hue.js. */
    hue: 262,
    published: '2026-10-25',
  },
];

/** Waar "Notes" in de balk en in het paneel heen wijst. */
export const NOTES_LINK = '/notes/';

/** "2026-10-25" wordt "25 October 2026". */
export function noteDate(iso) {
  const [year, month, day] = String(iso).split('-').map(Number);
  if (!year || !month || !day) return iso;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${day} ${months[month - 1]} ${year}`;
}
