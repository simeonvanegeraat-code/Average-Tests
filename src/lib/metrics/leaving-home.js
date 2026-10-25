/**
 * De beschrijving van de metriek "leaving home".
 *
 * Alles wat per metriek verschilt staat hier, en alleen hier: de eenheid, de zes
 * klassegrenzen, de lenzen en de woorden waarmee de kaart en het paneel over deze
 * cijfers praten. De componenten krijgen dit object als prop en zetten het in een
 * JSON-blok in de pagina, zodat het script in de browser met dezelfde configuratie
 * rekent als de server.
 *
 * Daarom staat hier geen enkele functie. Een formatteerfunctie zou de grens naar de
 * browser niet over kunnen, en dan zouden server en client ieder hun eigen lijstje
 * krijgen — precies de fout die de oude kaart maakte met twee lijsten klassegrenzen.
 *
 * Twee dingen die deze metriek bepalen:
 *
 * 1. Dit is geen gemiddelde. Eurostat labelt de dataset als "estimated average age",
 *    maar de eigen definitie zegt: de leeftijd waarop 50% van de bevolking niet meer
 *    bij de ouders woont. Een middelpunt, geen gemiddelde. De pagina volgt de
 *    definitie, niet het label.
 *
 * 2. Het is geen verdeling. We weten alleen waar dat middelpunt ligt. Er is dus geen
 *    percentiel uit te rekenen, en niets hier doet alsof dat kan.
 */
import { STAGES } from '../hue.js';

/** @type {import('../metric.js').MetricConfig} */
const leavingHome = {
  key: 'leaving-home',
  label: 'Leaving home',
  path: '/leaving-home/',
  hue: STAGES.leave,
  sourceName: 'Eurostat',

  /** Eén decimaal, want zo publiceert Eurostat het ook. */
  decimals: 1,
  unit: 'years',
  unitOne: 'year',

  /**
   * Zes vaste stappen in plaats van kwantielen: de legenda blijft dan hetzelfde als
   * de data bijwerkt, en een kaart waarvan de klassegrenzen elk jaar schuiven is niet
   * te vergelijken met die van vorig jaar.
   */
  bands: [
    { until: 22, label: 'under 22' },
    { until: 24, label: '22 to 24' },
    { until: 26, label: '24 to 26' },
    { until: 28, label: '26 to 28' },
    { until: 30, label: '28 to 30' },
    { until: Infinity, label: '30 and over' },
  ],

  lenses: [
    { key: 'total', label: 'Everyone', who: 'young people' },
    { key: 'men', label: 'Men', who: 'young men' },
    { key: 'women', label: 'Women', who: 'young women' },
  ],

  /**
   * De woorden waarmee over een hoger of lager cijfer wordt gesproken. Bij leeftijd
   * is hoger "later"; bij huishoudgrootte wordt dat "larger". Dat verschil hoort in
   * de beschrijving, niet in een `if` in een component.
   */
  words: {
    low: 'Earliest',
    high: 'Latest',
    comparative: 'earliest',
    above: 'later',
    below: 'earlier',
    mapSubject: 'the age by which half of {who} have left the parental home',
    euNote: "Eurostat's figure for the European Union.",
  },

  /** Het invoerveld van de persoonlijke laag. */
  input: {
    label: 'Age you left home',
    min: 10,
    max: 60,
    step: 0.5,
    placeholder: '21',
    noun: 'an age',
  },
};

export default leavingHome;
