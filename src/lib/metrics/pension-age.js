/**
 * De beschrijving van de metriek "pension-age".
 *
 * Eurostat `lfso_23pens03`: de leeftijd waarop iemand een ouderdomspensioen is gaan
 * ontvangen, uit de ad-hocmodule van de arbeidskrachtenenquête van 2023.
 *
 * **Dit is niet de wettelijke pensioenleeftijd.** Het is wat mensen zeggen dat er
 * gebeurd is, niet wat de wet voorschrijft. Dat verschil hoort in de kop en in de
 * methodesectie te staan; wie op "retirement age" zoekt bedoelt meestal het eerste
 * en vindt overal het tweede.
 *
 * `statinfo` kent AVG en MED; wij nemen AVG. De 24 leeftijdsbanden bleken geen
 * keuze: `Y_GE15`, `Y50-74` en `Y_GE50` geven per land identieke waarden, dus de
 * breedste.
 *
 * Eén waarneming: 2023. Geen venster, dus geen trendsectie.
 *
 * Alles hier is plat: geen functies, zodat de beschrijving door het JSON-blok naar
 * de browser kan en server en client met dezelfde configuratie rekenen.
 */
import { STAGES } from '../hue.js';

const pensionAge = {
  key: 'pension-age',
  label: 'Pension age',
  path: '/pension-age/',
  hue: STAGES.pension,
  sourceName: 'Eurostat',

  decimals: 1,
  unit: 'years',
  unitOne: 'year',

  /** Stappen van ongeveer een jaar rond het Europese cijfer van 61,3; de uitersten zijn 58,3 en 66,2. */
  bands: [
    { until: 60, label: 'under 60' },
    { until: 61, label: '60 to 61' },
    { until: 62, label: '61 to 62' },
    { until: 63, label: '62 to 63' },
    { until: 64.5, label: '63 to 64.5' },
    { until: Infinity, label: '64.5 and over' },
  ],

  lenses: [
    { key: 'total', label: 'Everyone', who: 'people' },
    { key: 'men', label: 'Men', who: 'men' },
    { key: 'women', label: 'Women', who: 'women' },
  ],

  words: {

    /** De titel boven de legenda van de kaart, in de eenheid van deze metriek. */

    legend: "Age an old-age pension began",
    low: 'Earliest',
    high: 'Latest',
    comparative: 'earliest',
    above: 'later',
    below: 'earlier',
    mapSubject: 'at what age {who} started drawing an old-age pension',
    euNote: "Eurostat's figure for the European Union.",
  },

  input: {
    label: 'The age you started, or expect to start',
    min: 40,
    max: 80,
    step: 0.5,
    placeholder: '65',
    noun: 'an age',
  },
};

export default pensionAge;
