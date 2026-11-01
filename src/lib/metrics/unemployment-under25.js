/**
 * De beschrijving van "werkloosheid onder de 25", voor /unemployment/by-age/.
 *
 * Eurostat `une_rt_m` met `age=Y_LT25` in plaats van `TOTAL`: dezelfde dataset, dezelfde
 * definitie, dezelfde maand, alleen een andere leeftijdsklasse. Daarom erft deze
 * beschrijving de tint van de hoofdpagina en krijgt hij er geen eigen: dit is een
 * subpagina van werkloosheid en geen elfde metriek. Hij staat dan ook niet in
 * src/lib/catalogue.js en dus niet in het menu.
 *
 * Wat wél eigen is, zijn de klassegrenzen. De jeugdcijfers lopen van 7,5 (Duitsland) tot
 * 29,2 (Noord-Macedonië); de banden van de hoofdpagina houden op bij 10 en zouden hier
 * vijfentwintig landen in één klasse duwen.
 */
import { STAGES } from '../hue.js';

const unemploymentUnder25 = {
  key: 'unemployment-under25',
  label: 'Unemployment under 25',
  path: '/unemployment/by-age/',
  hue: STAGES.jobless,
  sourceName: 'Eurostat',

  decimals: 1,

  /** Zie de hoofdpagina: een niveau is een percentage, een verschil is in procentpunten. */
  unit: 'percentage points',
  unitOne: 'percentage point',
  unitShort: '%',

  /**
   * Zes klassen van 7,5 tot 29,2, met het Europese cijfer op 15,5. De stappen zijn
   * smaller onderaan omdat de landen daar dichter op elkaar liggen: tussen 7 en 13
   * procent zitten tien landen, boven de 23 nog drie.
   */
  bands: [
    { until: 10, label: 'under 10%' },
    { until: 13, label: '10 to 13%' },
    { until: 16, label: '13 to 16%' },
    { until: 19, label: '16 to 19%' },
    { until: 23, label: '19 to 23%' },
    { until: Infinity, label: '23% and over' },
  ],

  lenses: [
    { key: 'total', label: 'Everyone', who: 'people' },
    { key: 'men', label: 'Men', who: 'men' },
    { key: 'women', label: 'Women', who: 'women' },
  ],

  words: {
    legend: 'Unemployed under 25, as a share of the labour force',
    low: 'Lowest',
    high: 'Highest',
    comparative: 'lowest',
    above: 'higher',
    below: 'lower',
    mapSubject: 'what share of {who} under 25 in the labour force are unemployed',
    euNote: "Eurostat's figure for the European Union.",
  },

  /**
   * Geen `input` en dus geen CompareForm, om dezelfde reden als op de hoofdpagina: je
   * bent werkloos of je bent het niet, en een percentage is een eigenschap van een land
   * en een leeftijdsgroep, niet van een persoon.
   */
};

export default unemploymentUnder25;
