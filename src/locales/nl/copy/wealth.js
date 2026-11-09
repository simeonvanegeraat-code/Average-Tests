/**
 * De Nederlandse zinnen van het vergelijkingsformulier op /wealth/.
 *
 * Tegenhanger van `src/locales/en/copy/wealth.js`, met dezelfde functies en dezelfde
 * argumenten. Ze draaien in de browser; `src/components/WealthCompare.astro` kiest de
 * taal uit `<html lang>` en geeft alleen opgemaakte tekst door.
 *
 * DRIE DINGEN DIE HIER ANDERS LOPEN DAN IN HET ENGELS
 *
 *  - **"worth" bestaat niet als los woord.** Het Engels zegt "are worth less than
 *    €40,900"; het Nederlands moet "waard" achteraan zetten, en in een zin met een
 *    bijzin erna ("half more") loopt dat niet. Die zin is daarom in twee stukken
 *    geschreven: "is minder dan €40.900 waard, de andere helft meer".
 *  - **Het lidwoord erbij.** De groepslabels komen uit `src/locales/nl/wealth.json` en
 *    staan daar zonder lidwoord ("Onderste 20%"), want in een tabelkop hoort er geen.
 *    In een lopende zin wel, dus die staat hier: "wat de onderste 20% bezit".
 *  - **"give or take" heeft geen korte tegenhanger.** Er staat "met een marge van".
 */
export default {
  errors: {
    amountMissing: 'Vul in wat je huishouden waard is.',
    amountRange: 'Vul een bedrag in tussen −€5 miljoen en €100 miljoen.',
    ageRange: 'Vul een leeftijd in tussen 16 en 110, of laat dat veld leeg.',
  },

  country: {
    /** Drie gevallen en niet twee: precies op de mediaan is niet "boven" met €0 verschil. */
    headline: ({ name, exact, above, g }) =>
      exact
        ? `Precies het middelste huishouden in ${g.withArticle(name)}`
        : above
          ? `Boven het middelste huishouden in ${g.withArticle(name)}`
          : `Onder het middelste huishouden in ${g.withArticle(name)}`,

    /**
     * Drie gevallen, want "het zou nog steeds boven de mediaan liggen in 0 van de 21
     * landen" is onzin en dat is precies wat er uit één sjabloonzin rolt.
     */
    lead: ({ times, aboveIn, total, above }) => {
      if (aboveIn === 0) {
        return `Dat is ${times} het middelste huishouden, en onder de mediaan in elk van deze ${total} landen.`;
      }
      if (aboveIn === total) {
        return `Dat is ${times} het middelste huishouden — boven de mediaan in alle ${total} landen hier.`;
      }
      return above
        ? `Dat is ${times} het middelste huishouden, en boven de mediaan in ${aboveIn} van de ${total} landen hier.`
        : `Dat is ${times} het middelste huishouden in je eigen land, maar het zou nog steeds boven de mediaan liggen in ${aboveIn} van de andere ${total} landen.`;
    },

    /** Alleen uitspraken die de data draagt: tussen welke twee groepsgemiddelden val je. */
    bracket: ({ beyond, belowLabel, belowValue, aboveLabel, aboveValue, name, g }) => {
      if (beyond) {
        return `Jouw bedrag ligt boven het gemiddelde van de bovenste 20% van de huishoudens in ${g.withArticle(name)} (${belowValue}). Voorbij dat punt zeggen de gepubliceerde groepen niets nuttigs meer — het bovenste vijfde deel reikt heel ver.`;
      }
      if (belowLabel && aboveLabel) {
        return `Het ligt tussen wat de ${belowLabel} van de huishoudens gemiddeld bezit (${belowValue}) en wat de ${aboveLabel} bezit (${aboveValue}).`;
      }
      if (aboveLabel) {
        return `Het ligt onder wat de ${aboveLabel} van de huishoudens gemiddeld bezit (${aboveValue}) — het onderste vijfde deel heeft in meerdere landen meer schuld dan bezit.`;
      }
      return '';
    },

    caption: ({ period }) =>
      `Mediaan nettovermogen per huishouden per land, ${period}. Jouw bedrag is de gemarkeerde lijn.`,
    chartTitle: 'Mediaan nettovermogen per huishouden per land, met jouw bedrag gemarkeerd',
  },

  age: {
    /** "75 en ouder" is in een paneelkop te lang; "75+" niet. Per taal, want het woord
        dat ingekort wordt verschilt. */
    label: ({ band, name, g }) =>
      `Vergeleken met ${band.replace(' en ouder', '+')} in ${g.withArticle(name)}`,
    headline: ({ above }) =>
      above ? 'Boven het midden van je leeftijdsgroep' : 'Onder het midden van je leeftijdsgroep',

    /** Wat de enquête over jouw groep zegt: het middelpunt, en het gemiddelde erboven. */
    lead: ({ name, band, median, times, aboveMean, mean, margin, g }) => {
      const half =
        `De helft van de huishoudens in ${g.withArticle(name)} met een referentiepersoon van ` +
        `${band} is minder dan ${median} waard, de andere helft meer.`;
      const where = times === null ? '' : ` Jouw bedrag is ${times} dat midden.`;
      const average = aboveMean
        ? ` Het ligt ook boven het gemiddelde van de groep (${mean}) — een hogere lat, doordat een handvol grote vermogens elk gemiddelde omhoogtrekt.`
        : ` Het ligt nog onder het gemiddelde van die groep (${mean}), en dat gemiddelde ligt ruim boven het midden doordat een handvol grote vermogens het omhoogtrekt.`;
      const give = margin ? ` De enquête legt het midden op ${median}, met een marge van ${margin}.` : '';
      return half + where + average + give;
    },

    /** De vorm van de curve in dit land, en of er wel een curve is om over te schrijven. */
    curve: ({ flat, name, peakLabel, peakValue, climb, youngestLabel, youngestValue, falls, oldestLabel, oldestValue, g }) => {
      if (flat) {
        return (
          `Leeftijd verschuift dit cijfer in ${g.withArticle(name)} nauwelijks: de hoogste groep ` +
          `(${peakLabel}) staat op ${peakValue}, maar ${climb} de groep ${youngestLabel}. In de ` +
          'meeste landen hier is die stap veel groter.'
        );
      }
      const rise =
        `In ${g.withArticle(name)} klimt het midden van ${youngestValue} bij ${youngestLabel} naar ` +
        `${peakValue} bij ${peakLabel} — ${climb} zoveel.`;
      const after = falls
        ? ` Daarna zakt het terug naar ${oldestValue} bij ${oldestLabel}.`
        : ' In de oudste groep klimt het nog steeds, en dat is ongebruikelijk: in de meeste landen hier is het dan al omgeslagen.';
      return rise + after;
    },

    /** Waar dit vandaan komt, en waarom het niet naast het paneel erboven mag liggen. */
    source: ({ wave, name, fieldwork, g }) =>
      `ECB Household Finance and Consumption Survey, golf ${wave}. Het veldwerk in ` +
      `${g.withArticle(name)} liep ${fieldwork}. De enquête telt de waarde van publieke en ` +
      'bedrijfspensioenen niet mee, dus deze cijfers liggen op een ander niveau dan de ' +
      'kwartaalrekeningen in het paneel hierboven — de twee zijn niet met elkaar vergelijkbaar.',

    caption: ({ name, g }) =>
      `Nettovermogen naar leeftijd van de referentiepersoon in ${g.withArticle(name)}: het midden (balk) en het gemiddelde (lijn). ` +
      'Jouw bedrag is de gemarkeerde lijn.',
    chartTitle: 'Nettovermogen naar leeftijd van de referentiepersoon, met jouw bedrag gemarkeerd',
  },

  /** Het woord bij de markering van je eigen bedrag in beide grafieken. */
  you: 'jij',

  tryExample: ({ name, amount, g }) =>
    `Probeer het middelste huishouden in ${g.withArticle(name)} (${amount}).`,

  share: {
    lines: ({ aboveIn, total, name, median, g }) => [
      `Mijn huishouden zou boven de mediaan liggen in ${aboveIn} van de ${total} Europese landen.`,
      `In ${g.withArticle(name)} is het middelste huishouden ${median} waard.`,
      'humanaverage.com/wealth',
    ],
    copied: 'Gekopieerd',
    prompt: 'Kopieer je uitkomst:',
  },
};
