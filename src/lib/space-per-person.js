/**
 * Vloeroppervlak per persoon: de eigen berekening van /dwelling-size/.
 *
 * Een woning van 149 m² in Cyprus en een van 137 m² in Noorwegen zeggen niet
 * hetzelfde, want in Cyprus wonen er meer mensen in. Deel de gemiddelde
 * woninggrootte door de gemiddelde huishoudgrootte en de rangorde verandert: de
 * ruimste woningen staan niet in de landen met de meeste ruimte per persoon.
 *
 * **Wat dit niet is.** Het is één gepubliceerd gemiddelde gedeeld door een ander,
 * niet het gemiddelde van wat elk huishouden per persoon heeft. Die twee zijn niet
 * gelijk — een gemiddelde van verhoudingen is iets anders dan een verhouding van
 * gemiddelden — en de pagina hoort dat te zeggen in plaats van het getal als een
 * meting te presenteren. Beide cijfers komen wel uit dezelfde enquête (EU-SILC) en
 * uit hetzelfde jaar; dat laatste is de reden dat deze functie een jaar kiest in
 * plaats van beide laatste jaargangen te pakken. Woninggrootte is van 2023 en
 * huishoudgrootte loopt door tot 2025.
 */

const rond = (value, decimals = 1) => Math.round(value * 10 ** decimals) / 10 ** decimals;

/**
 * @param dwelling  het gebouwde bestand van dwelling-size
 * @param household het gebouwde bestand van household-size
 */
export function spacePerPerson(dwelling, household, { year = dwelling.latestYear } = {}) {
  const peopleIn = (area) => area?.series?.[year];
  const households = new Map(household.countries.map((country) => [country.code, country]));

  const rows = [];
  const missing = [];

  for (const home of dwelling.countries.filter((country) => country.year === year)) {
    const people = peopleIn(households.get(home.code));
    if (typeof people !== 'number') {
      missing.push(home);
      continue;
    }
    // `per` is om te laten zien, `exact` om op te sorteren. Afgerond staan België
    // en Denemarken allebei op 63,3 en zou de rangorde van de afrondingsrichting
    // afhangen in plaats van van de cijfers.
    rows.push({
      code: home.code,
      name: home.name,
      m2: home.total,
      people,
      per: rond(home.total / people),
      exact: home.total / people,
    });
  }

  if (!rows.length) return null;

  const byArea = [...rows].sort((a, b) => b.m2 - a.m2);
  const byPerson = [...rows].sort((a, b) => b.exact - a.exact);

  // Twee rangordes op dezelfde landen: dat de twee niet gelijk lopen is wat deze
  // pagina te zeggen heeft, dus elk land draagt ze allebei.
  byArea.forEach((row, i) => {
    row.areaRank = i + 1;
  });
  byPerson.forEach((row, i) => {
    row.personRank = i + 1;
  });

  const euHome = dwelling.aggregates.find((area) => area.code === 'EU27_2020');
  const euHousehold = household.aggregates.find((area) => area.code === 'EU27_2020');
  const euPeople = peopleIn(euHousehold);
  const eu =
    euHome && typeof euPeople === 'number'
      ? { m2: euHome.total, people: euPeople, per: rond(euHome.total / euPeople) }
      : null;

  const biggest = byArea[0];
  const smallest = byArea[byArea.length - 1];
  const mostSpace = byPerson[0];
  const leastSpace = byPerson[byPerson.length - 1];

  return {
    year,
    of: rows.length,
    missing,
    eu,
    /** Beide lijsten lopen van hoog naar laag, zoals de lezer ze op de pagina ziet. */
    byArea,
    byPerson,
    biggest,
    smallest,
    mostSpace,
    leastSpace,
    /** De spreiding, in beide maten: per persoon valt hij breder uit. */
    ratioArea: rond(biggest.m2 / smallest.m2, 2),
    ratioPerson: rond(mostSpace.exact / leastSpace.exact, 2),
    /** Hoeveel landen een andere plek krijgen zodra je door de huishoudgrootte deelt. */
    moved: rows.filter((row) => row.areaRank !== row.personRank).length,
  };
}
