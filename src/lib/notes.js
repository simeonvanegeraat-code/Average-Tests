/**
 * De artikelen op /notes/.
 *
 * Eén regel per stuk, en de header en de voet lezen hieruit. Zo verschijnt een
 * nieuw artikel vanzelf overal, en kan het niet nog eens gebeuren dat er een
 * pagina staat waar vanaf de rest van de site geen route naartoe loopt.
 *
 * Er is bewust nog geen index op /notes/ — één artikel achter een overzichtspagina
 * is de dunne pagina die dit project niet wil. Bij de derde komt die er, en dan
 * verwijst de header daarheen in plaats van naar de artikelen zelf.
 */
export const NOTES = [
  {
    slug: 'eurostat-2021-series-break',
    path: '/notes/eurostat-2021-series-break/',
    /** De volledige kop, voor de voet en voor een latere index. */
    title: 'Why you cannot compare Eurostat figures across 2021',
    /** Kort genoeg voor een kaart in het mega menu. */
    card: 'Why 2021 breaks the series',
    published: '2026-10-25',
  },
];

/**
 * Waar "Notes" in de balk heen wijst.
 *
 * Bij één artikel rechtstreeks naar dat artikel: een overzichtspagina met één
 * regel erop is de dunne pagina die dit project niet wil, en AdSense wees de site
 * net af op "content van weinig waarde". Vanaf het tweede artikel wijst hij naar
 * /notes/, en dan is die index het bouwen waard.
 */
export const NOTES_LINK = NOTES.length === 1 ? NOTES[0].path : '/notes/';
