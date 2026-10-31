/**
 * De leeftijdslaag van /wealth/, op de ECB-enquête (HFCS).
 *
 * WAAROM DIT NAAST wealth.js STAAT EN ER NIET IN ZIT — lees dit voordat je hier iets
 * aan verandert.
 *
 * De site toont op /wealth/ de Distributional Wealth Accounts: kwartaalcijfers uit de
 * nationale rekeningen. Die kennen geen leeftijd. De enquête hiernaast kent die wel,
 * maar telt **publieke en bedrijfspensioenen niet mee**. Dat is geen detail: de mediaan
 * voor Nederland is €232k in de ene bron en €144k in de andere, voor Kroatië €59k tegen
 * €117k. In het middelste land scheelt het 1,09x, aan de randen 0,51x en 1,69x.
 *
 * Daarom rekent alles hier binnen één bron. Een bedrag wordt tegen de totaalmediaan
 * uit déze enquête gezet en tegen de leeftijdsgroepen daaruit, nooit tegen het cijfer
 * dat elders op de pagina staat. Eén zin die de twee combineert maakt het verschil
 * onzichtbaar en de uitkomst onwaar.
 *
 * Wat hier ook niet staat is een percentiel. De enquête publiceert per leeftijdsgroep
 * een middelpunt en een gemiddelde, geen verdeling; dezelfde reden als in wealth.js.
 */
import { periodLabel } from './period.js';

/** De groep waar een leeftijd in valt, of null buiten het bereik van de enquête. */
export function bandForAge(age, bands) {
  if (!Number.isFinite(age)) return null;
  return bands.find((b) => age >= b.from && (b.to === null || age <= b.to)) ?? null;
}

/**
 * Een bedrag tegenover de eigen leeftijdsgroep.
 *
 * Drie uitspraken, alle drie gedekt door wat gepubliceerd is: aan welke kant van het
 * middelpunt, hoeveel keer dat middelpunt, en of het ook boven het gemiddelde ligt.
 * Dat laatste is een hogere lat dan het lijkt — vermogen is scheef, dus het gemiddelde
 * ligt in elke groep boven het middelpunt, bij de jongste groepen ruim twee keer zo hoog.
 */
export function placeInBand(band, amount) {
  if (!band || !Number.isFinite(amount)) return null;
  return {
    amount,
    band,
    median: band.median,
    mean: band.mean,
    aboveMedian: amount >= band.median,
    aboveMean: band.mean !== null && amount >= band.mean,
    timesMedian: band.median > 0 ? amount / band.median : null,
    differenceFromMedian: amount - band.median,
    /** De standaardfout van de enquête: hoe scherp dit middelpunt gemeten is. */
    margin: band.medianSe ?? null,
  };
}

/**
 * De vorm van de curve in één land: waar het hoogtepunt ligt en hoe steil de klim is.
 *
 * Dit is wat de landpagina's uit elkaar houdt. De piek ligt bij 55-64 in de meeste
 * landen, maar bij 65-74 in Ierland, Spanje, Frankrijk en Portugal, bij 45-54 in
 * Estland, Letland en Slowakije, bij 35-44 in Litouwen, en pas bij 75+ in Luxemburg en
 * Finland. De klim van de jongste groep naar die piek loopt van 1,6x (Kroatië) tot
 * 31,6x (Finland).
 */
export function curveOf(country) {
  const bands = country.bands.filter((b) => b.median !== null);
  if (bands.length === 0) return null;

  const peak = bands.reduce((top, b) => (b.median > top.median ? b : top), bands[0]);
  const youngest = bands[0];
  const oldest = bands[bands.length - 1];

  return {
    bands,
    youngest,
    peak,
    oldest,
    /** Hoeveel keer de jongste groep de piek is. */
    climb: youngest.median > 0 ? peak.median / youngest.median : null,
    /** Hoeveel er na de piek weer af gaat; null als de piek de laatste groep is. */
    fall: peak.code === oldest.code ? null : (peak.median - oldest.median) / peak.median,
    /** Onder deze drempel is er geen curve om over te schrijven, alleen ruis. */
    flat: youngest.median > 0 && peak.median / youngest.median < 2,
  };
}

/** "2023-05" en "2023-06" worden "May and June 2023"; over een jaargrens heen voluit. */
export function fieldworkLabel(fieldwork) {
  if (!fieldwork?.from || !fieldwork?.to) return '';
  const van = periodLabel(fieldwork.from);
  const tot = periodLabel(fieldwork.to);
  if (van === tot) return van;

  const zelfdeJaar = fieldwork.from.slice(0, 4) === fieldwork.to.slice(0, 4);
  return zelfdeJaar ? `${van.split(' ')[0]} to ${tot}` : `${van} to ${tot}`;
}

/**
 * De spreiding van de piekleeftijd over de landen, voor de pagina die alle landen
 * naast elkaar zet. Geeft per groep welke landen daar hun hoogtepunt hebben.
 */
export function peaksByBand(countries, bands) {
  return bands
    .map((band) => ({
      band,
      countries: countries.filter((c) => c.peak === band.code),
    }))
    .filter((groep) => groep.countries.length > 0);
}

/** Landen gesorteerd op hoe sterk leeftijd meeweegt, steilste eerst. */
export function bySteepness(countries) {
  return [...countries]
    .filter((c) => Number.isFinite(c.climb))
    .sort((a, b) => b.climb - a.climb);
}
