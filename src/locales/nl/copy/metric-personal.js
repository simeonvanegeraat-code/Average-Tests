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
  'first-child': {
    exact: ({ name, value, g }) =>
      `Je was precies de gemiddelde leeftijd van ${g.withArticle(name)}: ${value}.`,

    /**
     * "ouder dan de gemiddelde moeder" en niet "ouder dan het gemiddelde": het cijfer
     * gaat over moeders, en die nuance staat in de Engelse zin ook.
     */
    off: ({ own, name, amount, higher, value, g }) =>
      `Met ${own} was je ${amount} ${higher ? 'ouder' : 'jonger'} dan de gemiddelde moeder in ${g.withArticle(name)} (${value}).`,

    allAbove: ({ of }) => `Dat is ouder dan het gemiddelde in elk van deze ${of} landen.`,

    allBelow: ({ of }) => `Dat is jonger dan het gemiddelde in alle ${of} landen hier.`,

    some: ({ above, of }) =>
      `Het is ouder dan het gemiddelde in ${above} van de ${of} landen, en jonger in ${of - above}.`,
  },

  'healthy-years': {
    exact: ({ own, name, value, g }) =>
      `Met ${own} zit je precies op de verwachting voor een pasgeborene in ${g.withArticle(name)} (${value}).`,

    /**
     * Twee richtingen, en de zin verschilt echt: wie jonger is dan de verwachting
     * heeft jaren te gaan, wie ouder is heeft ze voorbij. Eén "boven/onder" zou hier
     * onduidelijk zijn.
     */
    off: ({ own, name, amount, higher, value, g }) =>
      higher
        ? `Met ${own} ben je de verwachting voor een pasgeborene in ${g.withArticle(name)} (${value}) al ${amount} voorbij.`
        : `Met ${own} heeft de verwachting voor een pasgeborene in ${g.withArticle(name)} (${value}) nog ${amount} te gaan.`,

    allAbove: ({ of }) => `Dat is voorbij de verwachting in elk van deze ${of} landen.`,

    allBelow: ({ of }) => `Dat is onder de verwachting in alle ${of} landen hier.`,

    some: ({ above, of }) =>
      `Je bent er voorbij in ${above} van de ${of} landen, en nog niet in ${of - above}.`,
  },

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

  'working-hours': {
    exact: ({ name, value, g }) =>
      `Jouw week is precies de gebruikelijke week in ${g.withArticle(name)}: ${value}.`,

    /**
     * Niet "jouw 36 uur is 1,0 uur meer dan", want dat is een getal dat iets is in
     * plaats van iemand die iets doet. Het Nederlands zet hier liever het werkwoord
     * neer: je wérkt langer of korter.
     */
    off: ({ own, name, amount, higher, value, g }) =>
      `Met ${own} uur werk je ${amount} ${higher ? 'langer' : 'korter'} dan de gebruikelijke week in ${g.withArticle(name)} (${value}).`,

    allAbove: ({ of }) => `Dat is langer dan de gebruikelijke week in elk van deze ${of} landen.`,

    allBelow: ({ of }) => `Dat is korter dan de gebruikelijke week in alle ${of} landen hier.`,

    some: ({ above, of }) =>
      `Het is langer dan de gebruikelijke week in ${above} van de ${of} landen, en korter in ${of - above}.`,
  },

  'working-life': {
    exact: ({ ownValue, name, value, g }) =>
      `Je hebt ${ownValue} jaar gewerkt, precies wat een volledig werkzaam leven in ` +
      `${g.withArticle(name)} verwacht wordt te zijn (${value}).`,

    /**
     * Het Engels zegt "short of it" en laat het onderwerp bij jou liggen. In het
     * Nederlands leest "je bent er 4,0 jaar van verwijderd" stijf; "je hebt er nog
     * 4,0 jaar te gaan" zegt hetzelfde en loopt wel.
     */
    off: ({ ownValue, name, amount, higher, value, g }) =>
      higher
        ? `Je hebt ${ownValue} jaar gewerkt — ${amount} meer dan wat een volledig werkzaam ` +
          `leven in ${g.withArticle(name)} verwacht wordt te zijn (${value}).`
        : `Je hebt ${ownValue} jaar gewerkt. Een volledig werkzaam leven in ` +
          `${g.withArticle(name)} wordt verwacht ${value} te zijn, dus je hebt er nog ${amount} te gaan.`,

    allAbove: ({ of }) => `Dat is meer dan een volledig werkzaam leven in alle ${of} landen hier.`,

    allBelow: ({ of }) =>
      `Dat is minder dan een volledig werkzaam leven in elk van deze ${of} landen.`,

    /**
     * Deze metriek woordt de "minder"-kant, dus de uitersten hangen aan `below` en niet
     * aan `above` — bij een getal dat precies gelijk is lopen die niet gelijk.
     */
    some: ({ below, of }) =>
      below === 0
        ? `Dat is meer dan een volledig werkzaam leven in alle ${of} landen hier.`
        : below === of
          ? `Dat is minder dan een volledig werkzaam leven in elk van deze ${of} landen.`
          : `Het is minder dan het verwachte werkzame leven in ${below} van de ${of} landen, en meer in ${of - below}.`,
  },
};
