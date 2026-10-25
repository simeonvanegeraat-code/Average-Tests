/**
 * De beschrijving van de metriek "household-size".
 *
 * Eurostat `ilc_lvph01`: het gemiddelde aantal personen per huishouden, uit
 * EU-SILC. Geen uitsplitsing naar geslacht — een huishouden heeft er geen.
 *
 * Laatste reeksbreuk in 2025, het laatste jaar zelf. Er is dus geen venster waarin
 * een ontwikkeling door de tijd te tonen is, en deze pagina hoort er geen te hebben.
 *
 * Alles hier is plat: geen functies, zodat de beschrijving door het JSON-blok naar
 * de browser kan en server en client met dezelfde configuratie rekenen.
 */
import { STAGES } from '../hue.js';

const householdSize = {
  key: 'household-size',
  label: 'Household size',
  path: '/household-size/',
  hue: STAGES.household,
  sourceName: 'Eurostat',

  decimals: 1,
  unit: 'people',
  unitOne: 'person',

  /** Stappen van 0,25 rond het Europese cijfer van 2,3; de uitersten zijn 1,8 en 3,1. */
  bands: [
    { until: 2.0, label: 'under 2.0' },
    { until: 2.2, label: '2.0 to 2.2' },
    { until: 2.4, label: '2.2 to 2.4' },
    { until: 2.6, label: '2.4 to 2.6' },
    { until: 2.9, label: '2.6 to 2.9' },
    { until: Infinity, label: '2.9 and over' },
  ],

  /** Eén lens: de bron splitst niet naar geslacht. */
  lenses: [{ key: 'total', label: 'Everyone', who: 'households' }],

  words: {

    /** De titel boven de legenda van de kaart, in de eenheid van deze metriek. */

    legend: "People per household",
    low: 'Smallest',
    high: 'Largest',
    comparative: 'smallest',
    above: 'larger',
    below: 'smaller',
    mapSubject: 'how many people live in the average {who}',
    euNote: "Eurostat's figure for the European Union.",
  },

  input: {
    label: 'People in your household',
    min: 1,
    max: 15,
    step: 1,
    placeholder: '3',
    noun: 'a number of people',
  },
};

export default householdSize;
