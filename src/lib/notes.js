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
