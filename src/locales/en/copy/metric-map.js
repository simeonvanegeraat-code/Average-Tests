/**
 * De Engelse zinnen van de kaart en het detailpaneel.
 *
 * `src/lib/metric-map.js` rekent uit wát er waar is — de rangorde, het verschil met het
 * Europese cijfer, waar de reeks afbreekt — en geeft die uitkomst hier naartoe. Dit
 * bestand bepaalt alleen hoe dat klinkt.
 *
 * Die scheiding is de hele reden dat dit bestand bestaat. Eén logicapad, n woordpaden:
 * anders kan "welk land staat eerst" in het Nederlands iets anders beantwoorden dan in
 * het Engels, en dat is een fout die niemand ziet.
 *
 * WAT HIER WEL EN NIET IN STAAT
 *
 * Wel: woordorde, voegwoorden, interpunctie, lidwoorden. Niet: een getal, een
 * landnaam of een drempel. Die komen opgemaakt binnen. `words` is het woordenblok van
 * de metriek zelf (uit `src/locales/<taal>/metrics.json`) en is dus al in deze taal —
 * "Earliest" op de ene pagina, "Smallest" op de andere.
 *
 * Dit bestand draait **ook in de browser**: StageMap importeert `metric-map.js` in zijn
 * clientscript. Houd het daarom klein en zonder afhankelijkheden buiten `grammar.js`.
 */
import { grammarOf } from '../../../lib/grammar.js';

const g = grammarOf('en');

export default {
  /** Het Europese cijfer is geen land en heeft dus geen landnaam uit de data. */
  euName: 'European Union',

  /**
   * De alt-tekst van de kaart. Hij noemt het bereik met twee landen erbij, zodat iemand
   * die de kaart niet ziet hetzelfde weet als iemand die hem wel ziet — en de verwijzing
   * naar de tabel staat erin omdat dáár elk cijfer te vinden is.
   */
  mapSummary: ({ subject, period, low, high }) => {
    if (!low) return `Map of Europe: ${subject}.`;
    return (
      `Map of Europe: ${subject}, ${period}. ` +
      `It ranges from ${low.value} in ${g.withArticle(low.name)} ` +
      `to ${high.value} in ${g.withArticle(high.name)}. ` +
      'Every figure is also in the table below the map.'
    );
  },

  /**
   * "Earliest of 31 countries", "3rd earliest of 31 countries".
   *
   * `${of} countries` staat hier letterlijk en niet als `count(of, 'country',
   * 'countries')`, hoewel dat laatste netter zou zijn. Reden: bij één land schrijft de
   * huidige site "1 countries", en `count()` zou daar "1 country" van maken. Dat is een
   * verbetering, maar wel een gedragswijziging die niemand gevraagd heeft — en de
   * rangorde loopt in elke dataset over twintig tot eenendertig landen, dus hij bijt
   * nergens. Gemeld en niet veranderd.
   */
  rankNote: ({ rank, of, words }) => {
    if (rank === 1) return `${words.low} of ${of} countries`;
    if (rank === of) return `${words.high} of ${of} countries`;
    return `${g.ordinal(rank)} ${words.comparative} of ${of} countries`;
  },

  /** Hoe ver van het Europese cijfer. `equal` komt uit de drempel, niet uit deze tekst. */
  euDistance: ({ equal, amount, higher, words }) =>
    equal
      ? 'right on the EU figure'
      : `${amount} ${higher ? words.above : words.below} than the EU figure`,

  /** De losse stukken van de regel onder de waarde, aan elkaar. */
  joinNotes: (parts) => parts.filter(Boolean).join(' · '),

  /** Een land dat het laatste jaar niet haalt, krijgt geen plek in de rangorde. */
  behindNote: ({ latest, from }) =>
    `No ${latest} figure. This is the latest, from ${from}, and it is not ranked.`,

  noFigure: () => 'No figure for this group.',

  metaLine: ({ period, lensLabel }) => `${period} · ${lensLabel}`,

  /** Waar het trendlijntje voor staat, en waar het afbreekt en waarom. */
  sparkNote: ({ lensLabel, from, to, breaks, sourceName }) =>
    [
      from && to ? `${lensLabel}, ${from}–${to}.` : '',
      breaks.length === 0
        ? ''
        : `Notches mark ${sourceName} series breaks (${breaks.join(', ')}). The line is not drawn across them.`,
    ]
      .filter(Boolean)
      .join(' '),
};
