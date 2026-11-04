/**
 * De Nederlandse zinnen van de persoonlijke laag op een metriekpagina.
 *
 * Tegenhanger van `src/locales/en/copy/metric-personal.js`, met dezelfde sleutels. Draait
 * in de browser; de taal komt uit het JSON-blok van de pagina.
 *
 * Eén ding loopt hier anders dan in het Engels: "Your household of 3 is exactly the
 * average" wordt in het Nederlands niet "Jouw huishouden van 3 is precies het
 * gemiddelde", want dat leest als een rekenfout. "Jouw huishouden van 3 personen is
 * precies het gemiddelde van Nederland" zegt wat er staat.
 */

export default {
  'household-size': {
    exact: ({ own, name, g }) =>
      `Jouw huishouden van ${own} is precies het gemiddelde van ${g.withArticle(name)}.`,

    off: ({ own, name, amount, higher, value, g }) =>
      `Jouw huishouden van ${own} zit ${amount} ${higher ? 'boven' : 'onder'} het gemiddelde van ${g.withArticle(name)} (${value}).`,

    allAbove: ({ of }) => `Dat is groter dan het gemiddelde huishouden in elk van deze ${of} landen.`,

    allBelow: ({ of }) => `Dat is kleiner dan het gemiddelde huishouden in alle ${of} landen hier.`,

    some: ({ above, of }) =>
      `Het is groter dan het gemiddelde in ${above} van de ${of} landen, en kleiner in ${of - above}.`,
  },
};
