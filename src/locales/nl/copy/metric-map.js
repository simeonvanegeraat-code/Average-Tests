/**
 * De Nederlandse zinnen van de kaart en het detailpaneel.
 *
 * Tegenhanger van `src/locales/en/copy/metric-map.js`, met dezelfde functies en dezelfde
 * argumenten. `src/lib/metric-map.js` rekent uit wát er waar is en geeft die uitkomst
 * hier naartoe; dit bestand bepaalt alleen hoe het klinkt.
 *
 * `words` is het woordenblok van de metriek zelf, uit `src/locales/nl/metrics.json`, en
 * is dus al Nederlands — "Vroegst" op de ene pagina, "Kleinst" op de andere.
 */
import { grammarOf } from '../../../lib/grammar.js';

const g = grammarOf('nl');

export default {
  euName: 'Europese Unie',

  mapSummary: ({ subject, period, low, high }) => {
    if (!low) return `Kaart van Europa: ${subject}.`;
    return (
      `Kaart van Europa: ${subject}, ${period}. ` +
      `Dat loopt van ${low.value} in ${g.withArticle(low.name)} ` +
      `tot ${high.value} in ${g.withArticle(high.name)}. ` +
      'Elk cijfer staat ook in de tabel onder de kaart.'
    );
  },

  /**
   * "Vroegst van 31 landen", "3e vroegste van 31 landen".
   *
   * `landen` staat hier letterlijk en niet via `count()`, om dezelfde reden als in het
   * Engels: de rangorde loopt in elke dataset over twintig tot eenendertig landen, dus
   * het enkelvoud komt niet voor.
   */
  rankNote: ({ rank, of, words }) => {
    if (rank === 1) return `${words.low} van ${of} landen`;
    if (rank === of) return `${words.high} van ${of} landen`;
    return `${g.ordinal(rank)} ${words.comparative} van ${of} landen`;
  },

  euDistance: ({ equal, amount, higher, words }) =>
    equal
      ? 'precies op het EU-cijfer'
      : `${amount} ${higher ? words.above : words.below} dan het EU-cijfer`,

  joinNotes: (parts) => parts.filter(Boolean).join(' · '),

  behindNote: ({ latest, from }) =>
    `Geen cijfer voor ${latest}. Dit is het meest recente, uit ${from}, en het staat niet in de rangorde.`,

  noFigure: () => 'Geen cijfer voor deze groep.',

  metaLine: ({ period, lensLabel }) => `${period} · ${lensLabel}`,

  sparkNote: ({ lensLabel, from, to, breaks, sourceName }) =>
    [
      from && to ? `${lensLabel}, ${from}–${to}.` : '',
      breaks.length === 0
        ? ''
        : `De inkepingen markeren reeksbreuken van ${sourceName} (${breaks.join(', ')}). De lijn wordt er niet door getrokken.`,
    ]
      .filter(Boolean)
      .join(' '),
};
