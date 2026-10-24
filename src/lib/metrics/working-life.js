/**
 * De beschrijving van de metriek "duration of working life".
 *
 * Eurostat `lfsi_dwl_a`: het aantal jaren dat iemand van 15 naar verwachting actief
 * zal zijn op de arbeidsmarkt, berekend uit de arbeidsdeelname per leeftijd in dat
 * jaar. Het is dus geen terugblik op een afgeronde loopbaan maar een verwachting bij
 * het huidige gedrag — hetzelfde idee als levensverwachting, toegepast op werk.
 *
 * Dit is de enige van de gemeten Eurostat-reeksen zonder enkele reeksbreuk: 2000 tot
 * 2025 over 32 landen, ononderbroken. Daarom draagt deze pagina als enige een echt
 * trendverhaal; de andere kunnen alleen een dwarsdoorsnede tonen.
 */
import { STAGES } from '../hue.js';

const workingLife = {
  key: 'working-life',
  label: 'Working life',
  path: '/working-life/',
  hue: STAGES.retire,
  sourceName: 'Eurostat',

  decimals: 1,
  unit: 'years',
  unitOne: 'year',

  euCode: 'EU',

  /**
   * Zes stappen van drie jaar rond het Europese cijfer (37,5). De uitersten liggen
   * op 30,4 en 44,0, dus de onderste en bovenste klasse vangen de staarten.
   */
  bands: [
    { until: 33, label: 'under 33' },
    { until: 36, label: '33 to 36' },
    { until: 39, label: '36 to 39' },
    { until: 42, label: '39 to 42' },
    { until: 45, label: '42 to 45' },
    { until: Infinity, label: '45 and over' },
  ],

  lenses: [
    { key: 'total', label: 'Everyone', who: 'people' },
    { key: 'men', label: 'Men', who: 'men' },
    { key: 'women', label: 'Women', who: 'women' },
  ],

  words: {
    low: 'Shortest',
    high: 'Longest',
    comparative: 'shortest',
    above: 'longer',
    below: 'shorter',
    mapSubject: 'how many years {who} are expected to spend in the labour market',
    euNote: "Eurostat's figure for the European Union.",
  },

  input: {
    label: 'Years you have worked so far',
    min: 0,
    max: 60,
    step: 0.5,
    placeholder: '12',
    noun: 'a number of years',
  },
};

export default workingLife;
