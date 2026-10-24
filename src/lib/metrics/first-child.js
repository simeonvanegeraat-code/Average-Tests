/**
 * De beschrijving van de metriek "first-child".
 *
 * Eurostat `demo_find`, indicator `AGEMOTH1`: de gemiddelde leeftijd van de moeder
 * bij haar eerste kind.
 *
 * Van de moeder, niet van beide ouders: Eurostat publiceert hier geen vaderleeftijd.
 * De pagina zegt dat, in plaats van "ouders" te schrijven waar "moeders" staat.
 *
 * Dit is de strakste verdeling van alle metrieken op de site — het hoogste land ligt
 * maar 1,21 keer boven het laagste. Laatste breuk in 2023, dus geen trendsectie.
 *
 * Alles hier is plat: geen functies, zodat de beschrijving door het JSON-blok naar
 * de browser kan en server en client met dezelfde configuratie rekenen.
 */
import { STAGES } from '../hue.js';

const firstChild = {
  key: 'first-child',
  path: '/first-child/',
  hue: STAGES.child,
  sourceName: 'Eurostat',

  decimals: 1,
  unit: 'years',
  unitOne: 'year',

  euCode: 'EU',

  /** Stappen van één jaar rond het Europese cijfer van 29,9; uitersten 26,4 en 31,9. */
  bands: [
    { until: 27.5, label: 'under 27.5' },
    { until: 28.5, label: '27.5 to 28.5' },
    { until: 29.5, label: '28.5 to 29.5' },
    { until: 30.5, label: '29.5 to 30.5' },
    { until: 31.5, label: '30.5 to 31.5' },
    { until: Infinity, label: '31.5 and over' },
  ],

  /** Eén lens: de bron geeft alleen de leeftijd van de moeder. */
  lenses: [{ key: 'total', label: 'Mothers', who: 'mothers' }],

  words: {
    low: 'Youngest',
    high: 'Oldest',
    comparative: 'youngest',
    above: 'later',
    below: 'earlier',
    mapSubject: 'how old {who} are when they have their first child',
    euNote: "Eurostat's figure for the European Union.",
  },

  input: {
    label: 'Your age at your first child',
    min: 12,
    max: 60,
    step: 0.5,
    placeholder: '29',
    noun: 'an age',
  },
};

export default firstChild;
