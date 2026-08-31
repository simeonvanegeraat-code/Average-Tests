/**
 * Bouwtijd-helpers voor de drempelpagina's.
 *
 * Elke pagina gaat over één lengtewaarde. De regel uit CLAUDE.md is dat een pagina
 * alleen bestaat als hij iets zegt dat nergens anders staat, dus bepaalt dit bestand
 * per waarde wat de data feitelijk draagt en welke invalshoek mag leiden. Waar de
 * steekproef of de curve niets te melden heeft, laat de pagina die sectie weg in
 * plaats van hem met vulling te tonen.
 */

const REFERENCE_AGE = 40; // midden van het volwassen bereik, voor het hoofdverhaal
const MIN_RESPONDENTS = 30;
const MIN_AGE_SPAN = 5;   // onder dit aantal percentielpunten voegt de leeftijdstabel niets toe

export const CM_PER_INCH = 2.54;

export const toInches = (cm) => cm / CM_PER_INCH;
export const inchesToCm = (inch) => inch * CM_PER_INCH;

export function formatFeet(inch) {
  const feet = Math.floor(inch / 12);
  const rest = inch % 12;
  return rest === 0 ? `${feet}'0"` : `${feet}'${rest}"`;
}

/** "6 foot" / "5 foot 10" — hoe mensen het schrijven en zoeken. */
export function slugFor(inch) {
  const feet = Math.floor(inch / 12);
  const rest = inch % 12;
  return rest === 0 ? `${feet}-foot` : `${feet}-foot-${rest}`;
}

export function spellOut(inch) {
  const feet = Math.floor(inch / 12);
  const rest = inch % 12;
  return rest === 0 ? `${feet} foot` : `${feet} foot ${rest}`;
}

/** Percentiel van `cm` binnen een leeftijd/geslacht, lineair geinterpoleerd. */
export function percentileAt(table, sex, age, cm) {
  const p = table.sex[sex].byAge[String(age)].p;
  if (cm <= p[0]) return 1;
  if (cm >= p[p.length - 1]) return 99;
  let i = 1;
  while (i < p.length && p[i] <= cm) i++;
  return i + (cm - p[i - 1]) / (p[i] - p[i - 1]);
}

/** De opgeslagen drempels staan op 1 decimaal, dus matchen we op hele inches. */
export function thresholdFor(table, sex, inch) {
  return table.aggregates.thresholds[sex].find((t) => Math.round(toInches(t.value)) === inch);
}

/**
 * Welke invalshoek mag de pagina leiden?
 *
 * Dit is de kern van waarom deze pagina's geen dunne varianten van elkaar zijn: bij
 * 6'4" is de leeftijdscurve vlak op 99 en telt alleen zeldzaamheid, terwijl bij 5'2"
 * de mannenkant nietszeggend is en de vergelijking met vrouwen het verhaal draagt.
 */
export function angleFor(malePercentile, femalePercentile) {
  if (malePercentile >= 95) return 'rare-tall';
  if (malePercentile >= 70) return 'above-average';
  // Ruime middenband: op percentiel 25 tot 70 is een lengte voor een man gewoon
  // gangbaar. Een smallere band zette 5'8" (34e) in hetzelfde bakje als 5'0" (1e),
  // en dan krijgen twee heel verschillende pagina's hetzelfde verhaal.
  if (malePercentile >= 25) return 'typical';
  if (femalePercentile >= 25 && femalePercentile <= 80) return 'female-typical';
  return 'below-average';
}

/**
 * Hoeveel mensen zitten binnen een inch van deze lengte?
 *
 * Af te leiden uit de drempels: het aantal boven (h-1") min het aantal boven (h+1").
 * Dit verving een bewering die ik eerder onberekend opschreef ("meer Amerikanen zitten
 * binnen een inch van deze lengte dan van welke andere ook"). Die was niet gecontroleerd
 * en mocht er dus niet staan.
 */
export function withinAnInch(table, sex, inch) {
  const below = thresholdFor(table, sex, inch - 1);
  const above = thresholdFor(table, sex, inch + 1);
  if (!below || !above) return null;
  if (below.respondents - above.respondents < MIN_RESPONDENTS) return null;
  return {
    population: below.population - above.population,
    share: below.share - above.share,
    respondents: below.respondents - above.respondents,
  };
}

export function factsFor(table, inch, ages) {
  const cm = inchesToCm(inch);

  const curve = ages.map((age) => ({
    age,
    male: percentileAt(table, 'male', age, cm),
    female: percentileAt(table, 'female', age, cm),
  }));

  const malePercentiles = curve.map((c) => c.male);
  const span = Math.max(...malePercentiles) - Math.min(...malePercentiles);
  const lowest = curve.reduce((b, c) => (c.male < b.male ? c : b), curve[0]);
  const highest = curve.reduce((b, c) => (c.male > b.male ? c : b), curve[0]);

  const male = thresholdFor(table, 'male', inch);
  const female = thresholdFor(table, 'female', inch);

  const at40 = curve.find((c) => c.age === REFERENCE_AGE) ?? curve[Math.floor(curve.length / 2)];

  return {
    inch,
    cm,
    label: formatFeet(inch),
    slug: slugFor(inch),
    spelled: spellOut(inch),

    malePercentile: at40.male,
    femalePercentile: at40.female,
    angle: angleFor(at40.male, at40.female),

    // Bevolkingsaantallen alleen waar de steekproef ze draagt.
    malePopulation: male && male.respondents >= MIN_RESPONDENTS ? male : null,
    femalePopulation: female && female.respondents >= MIN_RESPONDENTS ? female : null,

    curve,
    // De leeftijdstabel verschijnt alleen als leeftijd echt iets uitmaakt.
    showCurve: span >= MIN_AGE_SPAN,
    span,
    lowest,
    highest,

    medianMale: table.aggregates.overall.male.p50,
    medianFemale: table.aggregates.overall.female.p50,
    // Afstand tot de mediaan, in hele inches: geeft elke pagina een eigen getal in
    // plaats van dezelfde zin met een ander percentiel erin.
    inchesFromMedianMale: Math.round(toInches(cm - table.aggregates.overall.male.p50)),
    inchesFromMedianFemale: Math.round(toInches(cm - table.aggregates.overall.female.p50)),

    neighbours: {
      male: withinAnInch(table, 'male', inch),
      female: withinAnInch(table, 'female', inch),
    },
  };
}

export { REFERENCE_AGE, MIN_RESPONDENTS };
