/**
 * De Nederlandse zinnen van "Waar dit cijfer aan vastzit".
 *
 * Tegenhanger van `src/locales/en/copy/related.js`, met dezelfde sleutels en dezelfde
 * gereedschapskist. Geen vertaling regel voor regel: een paar van deze zinnen loopt in
 * het Nederlands anders omdat de Engelse constructie hier niet werkt. "Where people
 * leave latest, households are fullest" is een parallelle vorm die het Nederlands niet
 * kent; daar staat nu een zin die hetzelfde zegt en wél Nederlands is.
 *
 * Elk cijfer komt door `show()` en staat dus met een komma.
 */

export default {
  'leaving-home': {
    'household-size': ({ e, show, g }) =>
      `Waar jongeren het laatst vertrekken, zijn de huishoudens het volst: in ${g.withArticle(e.high.name)} ligt dat punt op ${show('leaving-home', e.high.from)} ` +
      `en wonen er ${show('household-size', e.high.to)} mensen per huishouden, tegen ${show('household-size', e.low.to)} in ` +
      `${e.low.name}, waar de helft al op ${show('leaving-home', e.low.from)} weg is.`,

    'working-life': ({ e, show, g }) =>
      `Laat vertrekken betekent niet minder werken: ${g.withArticle(e.low.name, { capitalise: true })} combineert het vroegste vertrek uit huis ` +
      `(${show('leaving-home', e.low.from)}) met ${show('working-life', e.low.to)} jaar op de arbeidsmarkt, terwijl ` +
      `${e.high.name} ${show('leaving-home', e.high.from)} koppelt aan ${show('working-life', e.high.to)}.`,
  },

  'household-size': {
    'dwelling-size': ({ e, show }) =>
      `Een huishouden van ${show('household-size', e.high.from)} in ${e.high.name} heeft ${show('dwelling-size', e.high.to)} m² ` +
      `te delen; een van ${show('household-size', e.low.from)} in ${e.low.name} heeft ${show('dwelling-size', e.low.to)} m². ` +
      `Die pagina deelt het een door het ander.`,

    'leaving-home': ({ e, show }) =>
      `Grote huishoudens en laat vertrekken gaan samen: ${e.high.name} heeft ${show('household-size', e.high.from)} ` +
      `mensen per huishouden, en de helft van de jongeren woont er tot ${show('leaving-home', e.high.to)} nog thuis.`,
  },

  'dwelling-size': {
    'household-size': ({ e, show }) =>
      `Woonoppervlak zegt weinig zolang je niet weet met hoeveel mensen je het deelt: ${e.high.name} heeft de grootste woningen met ` +
      `${show('dwelling-size', e.high.from)} m², en er wonen ${show('household-size', e.high.to)} mensen in.`,

    wealth: ({ e, show }) =>
      `Het grootste bezit van de meeste Europese huishoudens is hun woning, en dat is te zien: ${e.high.name} koppelt ` +
      `${show('dwelling-size', e.high.from)} m² aan een mediaan huishouden van ${show('wealth', e.high.to)}, tegen ` +
      `${show('dwelling-size', e.low.from)} m² en ${show('wealth', e.low.to)} in ${e.low.name}.`,

    'first-child': ({ e, show }) =>
      `Grotere woningen en latere eerste kinderen liggen aan dezelfde kant van Europa: ${e.high.name} zit op gemiddeld ` +
      `${show('dwelling-size', e.high.from)} m² met een eerste kind op ${show('first-child', e.high.to)}, tegen ` +
      `${show('dwelling-size', e.low.from)} m² en ${show('first-child', e.low.to)} in ${e.low.name}.`,
  },

  'working-life': {
    'working-hours': ({ e, show, g }) =>
      `De langste loopbaan heeft de kortste week: ${g.withArticle(e.high.name)} verwacht ${show('working-life', e.high.from)} ` +
      `jaar werk bij ${show('working-hours', e.high.to)} uur, terwijl ${g.withArticle(e.low.name)} ` +
      `${show('working-life', e.low.from)} jaar verwacht bij ${show('working-hours', e.low.to)}.`,

    'pension-age': ({ e, show, g }) =>
      `Een lang werkzaam leven en een laat pensioen gaan samen: ${g.withArticle(e.high.name)} heeft ${show('working-life', e.high.from)} ` +
      `jaar op de arbeidsmarkt en een pensioen dat op ${show('pension-age', e.high.to)} begint; ${e.low.name} heeft ` +
      `${show('working-life', e.low.from)} jaar en ${show('pension-age', e.low.to)}.`,
  },

  'working-hours': {
    'working-life': ({ e, show, g }) =>
      `Korte weken betekenen geen korte loopbanen. ${g.withArticle(e.low.name, { capitalise: true })} werkt ${show('working-hours', e.low.from)} uur ` +
      `en verwacht alsnog ${show('working-life', e.low.to)} jaar op de arbeidsmarkt — meer dan ${e.high.name}, ` +
      `waar de week ${show('working-hours', e.high.from)} uur duurt.`,

    'leaving-home': ({ e, show }) =>
      `De landen met de langste weken zijn ook de landen waar jongeren het laatst het huis uit gaan: ${e.high.name} op ` +
      `${show('working-hours', e.high.from)} uur en ${show('leaving-home', e.high.to)}.`,
  },

  unemployment: {
    'leaving-home': ({ cross, show, g }) => {
      const byAge = [...cross.rows].sort((a, b) => a.b - b.b);
      const early = byAge[0];
      const late = byAge[byAge.length - 1];
      return (
        `Een moeilijke arbeidsmarkt zou jongeren thuis moeten houden, en over deze ${cross.of} ` +
        `landen is daar niets van te zien. ${g.withArticle(early.name, { capitalise: true })} heeft het ` +
        `vroegste vertrek van Europa, ${show('leaving-home', early.b)}, bij ` +
        `${show('unemployment', early.a)}% werkloosheid; ${late.name} het laatste, ` +
        `${show('leaving-home', late.b)}, bij ${show('unemployment', late.a)}%.`
      );
    },

    'working-life': ({ cross, show, g }) => {
      const byRate = [...cross.rows].sort((a, b) => a.a - b.a);
      const middle = byRate[Math.floor(byRate.length / 2)].a;
      const above = byRate.filter((row) => row.a >= middle);
      const counter = above.reduce((top, row) => (row.b > top.b ? row : top), above[0]);
      const lowest = byRate[0];
      return (
        `Werk zoeken telt nog steeds mee als deel van de beroepsbevolking, dus een hoog cijfer hier haalt ` +
        `niets af van het werkzame leven erachter. ${g.withArticle(counter.name, { capitalise: true })} verwacht ` +
        `${show('working-life', counter.b)} jaar op de arbeidsmarkt bij ${show('unemployment', counter.a)}% ` +
        `werkloosheid; ${g.withArticle(lowest.name)}, met het laagste cijfer hier op ` +
        `${show('unemployment', lowest.a)}%, verwacht ${show('working-life', lowest.b)}.`
      );
    },
  },

  'pension-age': {
    'healthy-years': ({ crossings, show, g }) => {
      const cross = crossings('healthy-years', 'pension-age');
      return (
        `In ${cross.under} van deze ${cross.of} landen zijn de gezonde jaren op voordat het pensioen begint. Het ` +
        `grootste verschil staat in ${g.withArticle(cross.widest.name)}: ${show('healthy-years', cross.widest.a)} gezonde jaren ` +
        `tegen een pensioen dat op ${show('pension-age', cross.widest.b)} begint.`
      );
    },

    'working-life': ({ e, show, g }) =>
      `Hoe later het pensioen, hoe langer het werkzame leven ervoor: ${g.withArticle(e.high.name)} begint op ` +
      `${show('pension-age', e.high.from)} na ${show('working-life', e.high.to)} jaar werk.`,
  },

  'healthy-years': {
    'pension-age': ({ crossings, show, g }) => {
      const cross = crossings('healthy-years', 'pension-age');
      return (
        `Gezonde jaren en pensioenleeftijd bewegen niet samen. In ${cross.under} van deze ${cross.of} landen zijn de ` +
        `gezonde jaren eerder op — in ${g.withArticle(cross.widest.name)} ${show('healthy-years', Math.abs(cross.widest.gap))} jaar eerder.`
      );
    },

    'working-life': ({ e, show, g }) =>
      `${g.withArticle(e.high.name, { capitalise: true })} heeft de meeste gezonde jaren (${show('healthy-years', e.high.from)}) en een van de ` +
      `kortste werkzame levens (${show('working-life', e.high.to)} jaar); ${e.low.name} heeft de minste ` +
      `(${show('healthy-years', e.low.from)}) en werkt ${show('working-life', e.low.to)} jaar.`,
  },

  'first-child': {
    'leaving-home': ({ crossings, show, g }) => {
      const cross = crossings('first-child', 'leaving-home');
      return (
        `In ${cross.under} van deze ${cross.of} landen komt het eerste kind voordat het ouderlijk huis verlaten is. ` +
        `${g.withArticle(cross.widest.name, { capitalise: true })} gaat daarin het verst: een eerste kind op ` +
        `${show('first-child', cross.widest.a)}, en het middelpunt voor het huis uit gaan op ${show('leaving-home', cross.widest.b)}.`
      );
    },

    'dwelling-size': ({ e, show }) =>
      `Latere eerste kinderen en grotere woningen liggen aan dezelfde kant van Europa: ${e.high.name} op ` +
      `${show('first-child', e.high.from)} en ${show('dwelling-size', e.high.to)} m².`,
  },

  wealth: {
    'dwelling-size': ({ e, show }) =>
      `Het meeste van dat vermogen is de woning waarin het gemeten wordt: ${e.high.name}, met een mediaan huishouden van ` +
      `${show('wealth', e.high.from)}, heeft gemiddeld ${show('dwelling-size', e.high.to)} m² woonoppervlak.`,

    'household-size': ({ e, show }) =>
      `Vermogen wordt per huishouden geteld, dus de grootte van dat huishouden hoort bij het antwoord: in ${e.high.name} staan ` +
      `${show('household-size', e.high.to)} mensen achter ${show('wealth', e.high.from)}, in ${e.low.name} ` +
      `${show('household-size', e.low.to)} achter ${show('wealth', e.low.from)}.`,
  },
};
