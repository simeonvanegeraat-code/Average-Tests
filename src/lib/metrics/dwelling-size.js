/**
 * De beschrijving van de metriek "dwelling-size".
 *
 * Eurostat `ilc_lvho32`: de gemiddelde oppervlakte van een woning in vierkante
 * meter, uit EU-SILC. De dataset splitst naar inkomenskwintiel en eigendomsvorm;
 * wij nemen van allebei `TOTAL`, want dat ís het kopcijfer. Dat is het verschil met
 * `ilc_lvho04` (kamers per persoon), dat in NOT_BUILT staat omdat daar wél een
 * redactionele keuze nodig is.
 *
 * Eén waarneming: 2023. Er is dus geen venster waarin een ontwikkeling te tonen is,
 * en deze pagina hoort er geen te hebben.
 *
 * Alles hier is plat: geen functies, zodat de beschrijving door het JSON-blok naar
 * de browser kan en server en client met dezelfde configuratie rekenen.
 */
import { STAGES } from '../hue.js';

const dwellingSize = {
  key: 'dwelling-size',
  label: 'Home size',
  path: '/dwelling-size/',
  hue: STAGES.dwelling,
  sourceName: 'Eurostat',

  decimals: 1,
  unit: 'm²',
  unitOne: 'm²',

  /** Stappen van ongeveer 15 m² rond het Europese cijfer van 102,8; de uitersten zijn 54,6 en 149,4. */
  bands: [
    { until: 80, label: 'under 80' },
    { until: 95, label: '80 to 95' },
    { until: 105, label: '95 to 105' },
    { until: 120, label: '105 to 120' },
    { until: 140, label: '120 to 140' },
    { until: Infinity, label: '140 and over' },
  ],

  /** Eén lens: een woning heeft geen geslacht. */
  lenses: [{ key: 'total', label: 'Everyone', who: 'homes' }],

  words: {

    /** De titel boven de legenda van de kaart, in de eenheid van deze metriek. */

    legend: "Floor area per home, in m²",
    low: 'Smallest',
    high: 'Largest',
    comparative: 'smallest',
    above: 'larger',
    below: 'smaller',
    mapSubject: 'how much floor space the average {who} has',
    euNote: "Eurostat's figure for the European Union.",
  },

  input: {
    label: 'Your home in square metres',
    min: 10,
    max: 600,
    step: 1,
    placeholder: '95',
    noun: 'a floor area',
  },
};

export default dwellingSize;
