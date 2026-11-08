/**
 * De Engelse zinnen van de persoonlijke laag op een metriekpagina: wat er staat nadat de
 * bezoeker zijn eigen getal invult.
 *
 * Deze zinnen draaien **in de browser**. Tot 4 november 2026 stonden ze acht keer
 * gekopieerd in acht paginabestanden — elk met hetzelfde script van 71 regels eronder.
 * Nu staan ze één keer per taal, en `src/components/MetricPersonal.astro` kiest de taal
 * uit het JSON-blok dat de pagina toch al meestuurt.
 *
 * Per metriek, want de zin verschilt: een huishouden is "groter", een leeftijd "ouder".
 * `words` komt uit `src/locales/<taal>/metrics.json` en is dus al in deze taal.
 *
 * Elke functie krijgt opgemaakte tekst binnen, nooit een ruw getal. De opmaak gebeurt in
 * het script, door `format.js`, zodat de notatie van deze taal klopt.
 */

export default {
  'first-child': {
    exact: ({ name, value, g }) =>
      `You were exactly the average age for ${g.withArticle(name)}: ${value}.`,

    off: ({ own, name, amount, higher, value, g }) =>
      `At ${own} you were ${amount} ${higher ? 'older' : 'younger'} than the average mother in ${g.withArticle(name)} (${value}).`,

    allAbove: ({ of }) => `That is older than the average in every one of the ${of} countries here.`,

    allBelow: ({ of }) => `That is younger than the average in all ${of} countries here.`,

    some: ({ above, of }) =>
      `It is older than the average in ${above} of ${of} countries, and younger in ${of - above}.`,
  },

  'healthy-years': {
    exact: ({ own, name, value, g }) =>
      `At ${own}, a newborn's expectation in ${g.withArticle(name)} (${value}) is exactly where you are.`,

    /**
     * Twee richtingen, en de zin verschilt echt: wie jonger is dan de verwachting
     * heeft jaren te gaan, wie ouder is heeft ze voorbij. Een enkel "boven/onder"
     * zou hier onduidelijk zijn.
     */
    off: ({ own, name, amount, higher, value, g }) =>
      higher
        ? `At ${own}, you are already ${amount} past the healthy-years expectation for a newborn in ${g.withArticle(name)} (${value}).`
        : `At ${own}, a newborn's expectation in ${g.withArticle(name)} (${value}) still has ${amount} to run.`,

    allAbove: ({ of }) => `That is past the expectation in every one of the ${of} countries here.`,

    allBelow: ({ of }) => `That is below the expectation in all ${of} countries here.`,

    some: ({ above, of }) =>
      `You are past it in ${above} of ${of} countries, and short of it in ${of - above}.`,
  },

  'household-size': {
    exact: ({ own, name, g }) => `Your household of ${own} is exactly the average for ${g.withArticle(name)}.`,

    off: ({ own, name, amount, higher, value, g }) =>
      `Your household of ${own} is ${amount} ${higher ? 'above' : 'below'} the average for ${g.withArticle(name)} (${value}).`,

    allAbove: ({ of }) => `That is larger than the average household in every one of the ${of} countries here.`,

    allBelow: ({ of }) => `That is smaller than the average household in all ${of} countries here.`,

    some: ({ above, of }) =>
      `It is larger than the average in ${above} of ${of} countries, and smaller in ${of - above}.`,
  },

  'working-hours': {
    exact: ({ name, value, g }) =>
      `Your week matches the usual week in ${g.withArticle(name)} exactly: ${value}.`,

    off: ({ own, name, amount, higher, value, g }) =>
      `Your ${own} hours are ${amount} ${higher ? 'above' : 'below'} the usual week in ${g.withArticle(name)} (${value}).`,

    allAbove: ({ of }) => `That is longer than the usual week in every one of the ${of} countries here.`,

    allBelow: ({ of }) => `That is shorter than the usual week in all ${of} countries here.`,

    some: ({ above, of }) =>
      `It is longer than the usual week in ${above} of ${of} countries, and shorter in ${of - above}.`,
  },
};
