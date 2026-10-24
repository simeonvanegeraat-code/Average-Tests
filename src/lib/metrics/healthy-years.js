/**
 * De beschrijving van de metriek "healthy-years".
 *
 * Eurostat `hlth_hlye`, indicator `HLY_Y0`: het aantal jaren dat een pasgeborene
 * naar verwachting leeft zonder beperking in dagelijkse bezigheden.
 *
 * Let op het verschil met levensverwachting. Daar lopen vrouwen overal voor; hier
 * niet: in negen van de 28 landen hebben mannen méér gezonde jaren, en gemiddeld
 * schelen de twee nog geen jaar. Dat is de bevinding die deze pagina draagt.
 *
 * Laatste reeksbreuk in 2024, het laatste jaar zelf — geen trendsectie dus.
 *
 * Alles hier is plat: geen functies, zodat de beschrijving door het JSON-blok naar
 * de browser kan en server en client met dezelfde configuratie rekenen.
 */
import { STAGES } from '../hue.js';

const healthyYears = {
  key: 'healthy-years',
  label: 'Healthy years',
  path: '/healthy-years/',
  hue: STAGES.healthy,
  sourceName: 'Eurostat',

  decimals: 1,
  unit: 'years',
  unitOne: 'year',

  euCode: 'EU',

  /** Stappen van vier jaar rond het Europese cijfer van 65,2; uitersten 52,5 en 73,4. */
  bands: [
    { until: 57, label: 'under 57' },
    { until: 61, label: '57 to 61' },
    { until: 65, label: '61 to 65' },
    { until: 69, label: '65 to 69' },
    { until: 73, label: '69 to 73' },
    { until: Infinity, label: '73 and over' },
  ],

  lenses: [
    { key: 'total', label: 'Everyone', who: 'people' },
    { key: 'men', label: 'Men', who: 'men' },
    { key: 'women', label: 'Women', who: 'women' },
  ],

  words: {
    low: 'Fewest',
    high: 'Most',
    comparative: 'fewest',
    above: 'more',
    below: 'fewer',
    mapSubject: 'how many years {who} can expect to live without a limiting health problem',
    euNote: "Eurostat's figure for the European Union.",
  },

  input: {
    label: 'Your age',
    min: 0,
    max: 110,
    step: 1,
    placeholder: '38',
    noun: 'an age',
  },
};

export default healthyYears;
