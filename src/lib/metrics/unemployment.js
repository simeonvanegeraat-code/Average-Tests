/**
 * De beschrijving van de metriek "unemployment".
 *
 * Eurostat `une_rt_m`: het aantal werklozen als percentage van de beroepsbevolking,
 * seizoengecorrigeerd, per maand. Werkloos is hier de definitie van de ILO — zonder
 * werk, beschikbaar om te beginnen en actief aan het zoeken — en niet "ingeschreven
 * bij een uitkeringsinstantie". Dat verschil is groot: iemand zonder uitkering die
 * zoekt telt mee, iemand met een uitkering die niet zoekt niet.
 *
 * Dit is de eerste bron achter deze site die niet per jaar maar per maand publiceert.
 * Daar hing meer aan dan een pagina: een tijdas die op jaartallen rekende (het
 * trendlijntje, het detailpaneel van de kaart) gaf op "2026-08" stilletjes NaN. Dat
 * rekenwerk staat nu in src/lib/period.js.
 *
 * Twee landen dragen een reeksbreuk: Malta in januari 2025 en Denemarken in oktober
 * 2023. Omdat `trend()` weigert over een breuk heen te rekenen, is het venster waarin
 * álle dertig landen vergelijkbaar zijn maar negentien maanden breed. De pagina rekent
 * daarbinnen, en noemt de vijf jaar alleen per land — voor de achtentwintig landen die
 * een ononderbroken reeks hebben.
 */
import { STAGES } from '../hue.js';

const unemployment = {
  key: 'unemployment',
  label: 'Unemployment',
  path: '/unemployment/',
  hue: STAGES.jobless,
  sourceName: 'Eurostat',

  decimals: 1,

  /**
   * Een niveau is een percentage, een verschil is in procentpunten, en die twee
   * verwarren is de klassieke fout bij deze cijfers: van 6,6 naar 6,1 is een daling
   * van 0,5 procentpunt en niet van 0,5 procent (dat zou 0,03 punt zijn).
   *
   * `formatAmount()` zet `unit` achter een hoeveelheid, en elke plek waar dat gebeurt
   * is een verschil: de gap-kolom in de tabel, de bevindingen op de pagina. Vandaar
   * procentpunten hier. `unitShort` is voor de twee plekken die een níveau tonen — de
   * kaartjes in het menu en op de voorpagina.
   */
  unit: 'percentage points',
  unitOne: 'percentage point',
  unitShort: '%',

  /**
   * Zes klassen van 3,2 (Tsjechië) tot 11,0 (Noord-Macedonië), met het Europese cijfer
   * op 6,1. De stappen zijn smal onderaan en breed bovenaan omdat de landen daar zo
   * liggen: tussen 3 en 6 procent zit de helft van Europa, boven de 8 nog maar zes
   * landen. Zes gelijke stappen zouden drie lege klassen en één propvolle geven.
   */
  bands: [
    { until: 4, label: 'under 4%' },
    { until: 5, label: '4 to 5%' },
    { until: 6, label: '5 to 6%' },
    { until: 8, label: '6 to 8%' },
    { until: 10, label: '8 to 10%' },
    { until: Infinity, label: '10% and over' },
  ],

  lenses: [
    { key: 'total', label: 'Everyone', who: 'people' },
    { key: 'men', label: 'Men', who: 'men' },
    { key: 'women', label: 'Women', who: 'women' },
  ],

  words: {
    legend: 'Unemployed, as a share of the labour force',
    low: 'Lowest',
    high: 'Highest',
    comparative: 'lowest',
    above: 'higher',
    below: 'lower',
    mapSubject: 'what share of {who} in the labour force are unemployed',
    euNote: "Eurostat's figure for the European Union.",
  },

  /**
   * Geen `input`, en dus geen CompareForm: dit is de eerste pagina zonder.
   *
   * De andere acht vragen om een getal dat je van jezelf weet — je leeftijd, je uren,
   * de jaren die je gewerkt hebt — en zetten dat naast het landencijfer. Werkloosheid
   * heeft dat getal niet. Je bent werkloos of je bent het niet; een percentage is een
   * eigenschap van een land en niet van een persoon. "Hoe lang zoek je al?" zou een
   * duur naast een aandeel zetten, en dat zijn twee verschillende dingen.
   *
   * De persoonlijke laag is daarom de landenkiezer in de kaart: die onthoudt je land
   * in het profiel en het paneel zegt waar het staat.
   */
};

export default unemployment;
