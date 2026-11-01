/**
 * De opmaakgrens: hoe een getal eruitziet in de taal van de pagina.
 *
 * Nederlands schrijft `24,6` waar Engels `24.6` schrijft, en `€1.053.910` waar Engels
 * `€1,053,910` schrijft. Dat is geen vertaling van een woord maar van een notatie, en
 * het hoort daarom op één plek te staan in plaats van bij elke aanroep.
 *
 * WAAROM DE TAAL NIET PER AANROEP MEEGAAT
 *
 * `formatValue`, `formatAmount`, `signed` en `euro` worden samen 155 keer aangeroepen.
 * Elke aanroep een taal meegeven betekent dat ook elke tussenliggende functie er een
 * krijgt — de hele tekstlaag, van `metric-map.js` tot `leaving-home-copy.js`. Dat is
 * fase 3 en niet deze. Daarom gaat de taal mee langs de twee wegen die er al zijn:
 *
 *   1. Op de server: in de metriekconfiguratie. `metric.js` legt uit waarom opmaak
 *      daar als gegevens staat en niet als code — omdat het JSON-blok dat de browser
 *      leest geen functie kan dragen. Een `locale` erbij reist dus gratis mee naar
 *      alle 155 plekken, en ook naar de client.
 *   2. In de browser: uit `<html lang>`. Dat attribuut zet `BaseV2.astro` al uit het
 *      URL-voorvoegsel. Een clientscript dat zijn eigen configuratie uit een
 *      data-attribuut opbouwt (DotPlot doet dat) heeft de taal dan nog steeds, en kan
 *      per definitie niet afwijken van de taal die de pagina van zichzelf zegt.
 *
 * Wat hier NIET staat is een veranderlijke modulevariabele met "de huidige taal".
 * Astro rendert tijdens een build meerdere pagina's in één proces; een variabele die
 * tussen pagina's blijft staan, levert een pagina in de verkeerde taal op en dat is de
 * stilste bug die deze site kan hebben.
 *
 * WAAROM ER EERST AFGEROND WORDT EN DAN OPGEMAAKT
 *
 * `toFixed` en `Intl.NumberFormat` ronden niet hetzelfde af. `toFixed` kijkt naar de
 * exacte binaire waarde, `Intl` naar de kortste decimale weergave:
 *
 *   0.145 ligt binair op 0.14499999999999999001
 *   (0.145).toFixed(2) === '0.14'   ← ziet "net onder 0.145"
 *   Intl ... .format(0.145) === '0.15'   ← ziet "0.145" en rondt op
 *
 * Over het bereik waarin deze site rekent verschillen ze op 20.800 van 1.600.004
 * waarden, en de helft daarvan is negatief. Op de data van vandaag bijt dat nergens
 * (12.642 waarden nagerekend, nul verschillen), maar bij de eerste verversing die een
 * waarde als 2,45 publiceert wel.
 *
 * Deze laag mag geen enkel cijfer veranderen, dus wordt er afgerond met de regel die
 * de site al heeft en pas daarna opgemaakt. Na `toFixed` heeft de waarde precies het
 * aantal decimalen dat gevraagd is, en dan kan `Intl` niet meer afronden — er valt
 * niets te kiezen. Welke van de twee regels de juiste is, is een aparte vraag voor
 * Simeon en niet iets om in een verbouwing stil te beslissen.
 */
import { DEFAULT_LOCALE } from './locales.js';

/**
 * In welke taal dit getal geschreven wordt.
 *
 * Expliciet gaat voor. Daarna het document, want in de browser is `<html lang>` de
 * taal van de pagina en is er geen tweede waarheid. Op de server bestaat `document`
 * niet en valt het terug op de standaardtaal.
 */
export function localeOfNumber(locale) {
  if (locale) return locale;
  if (typeof document !== 'undefined' && document.documentElement?.lang) {
    return document.documentElement.lang;
  }
  return DEFAULT_LOCALE;
}

/**
 * `Intl.NumberFormat` opzetten kost meer dan formatteren. Eén build maakt tienduizenden
 * getallen, dus de opzet wordt hergebruikt per combinatie.
 */
const cache = new Map();

function formatter(locale, decimals, grouping) {
  const key = `${locale}|${decimals}|${grouping}`;
  let found = cache.get(key);
  if (!found) {
    found = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping,
    });
    cache.set(key, found);
  }
  return found;
}

/**
 * Een getal met een vast aantal decimalen, zonder duizendscheiding: `24.6` / `24,6`.
 *
 * Geen duizendscheiding, omdat `toFixed` die ook niet gaf en geen enkele metriek boven
 * de duizend komt. Zet die aan en `1000.0` wordt `1,000.0` — een zichtbare wijziging
 * zonder dat iemand erom vroeg.
 */
export function decimal(value, decimals = 1, { locale } = {}) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const rounded = Number(value.toFixed(decimals));
  return formatter(localeOfNumber(locale), decimals, false).format(rounded);
}

/**
 * Een heel getal mét duizendscheiding: `1,053,910` / `1.053.910`.
 *
 * Hier is afronden niet nodig: de bedragen zijn al heel voordat ze hier komen, en op
 * een heel getal kunnen `toFixed` en `Intl` niet van elkaar afwijken.
 */
export function grouped(value, { locale } = {}) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return formatter(localeOfNumber(locale), 0, true).format(Math.round(value));
}
