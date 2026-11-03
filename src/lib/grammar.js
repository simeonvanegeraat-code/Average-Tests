/**
 * Alles wat van de taal van de zin afhangt, en niets anders.
 *
 * Lidwoorden, meervouden en rangtelwoorden zijn geen eigenschap van een dataset maar
 * van de taal waarin de zin staat. Ze stonden daarom op twee verkeerde plekken: in
 * metric.js (de Eurostat-motor) en in wealth.js (de ECB-plaatsing), met in beide een
 * eigen `NEEDS_ARTICLE`. Dat zijn twee lijsten die uiteen kunnen lopen, en dat deden
 * ze ook: metric.js kende het Verenigd Koninkrijk, wealth.js niet.
 *
 * Die twee lijsten zijn hier één geworden. Dat kon zonder dat er een zin verandert,
 * want de ECB-reeks dekt 21 landen van de eurozone en het Verenigd Koninkrijk zit
 * daar niet bij — `withArticle()` en `possessive()` kregen die naam in wealth.js dus
 * nooit te zien. Nagekeken op 1 november 2026 tegen data/wealth/index.json.
 *
 * WAT HIER OP 3 NOVEMBER BIJ KWAM
 *
 * Elke functie kent nu meer dan één taal. Wat er níét gebeurd is: de ~90 aanroepen
 * van `withArticle()` een taal meegeven. Die staan vrijwel allemaal ín een Engelse
 * zin, en die zinnen verhuizen in stap 2 en 3 van het plan naar een taalmodule —
 * dáár staat de aanroep straks in Nederlandse code en kan hij de Nederlandse
 * grammatica rechtstreeks vragen. Ze nu allemaal patchen zou betekenen dat ze
 * allemaal nóg een keer langs moeten. Daarom houdt elke losse export hieronder zich
 * precies zoals vandaag zolang je geen taal meegeeft: Engels, byte voor byte.
 *
 * Wie een taal wél bij de hand heeft, vraagt `grammarOf(lang)` en krijgt dezelfde
 * vier functies met die taal erin gebonden.
 */
import { DEFAULT_LOCALE } from './locales.js';

/**
 * Welke landnamen een lidwoord krijgen, en welk — per taal, want dit is geen
 * eigenschap van een land maar van een taal.
 *
 * Dat verschil is hier meteen te zien: het Engels zet een lidwoord voor
 * "Netherlands", het Nederlands zet er géén voor "Nederland". Een lijst die je
 * vertaalt zou dat fout doen. Een lijst per taal kan het niet fout doen.
 *
 * De sleutel is de naam zoals hij in `src/locales/<taal>/countries.json` staat, niet
 * de landcode, omdat `withArticle()` een naam binnenkrijgt en geen code. Daar zit een
 * valkuil in: schrijf je de naam anders dan het woordenbestand, dan gebeurt er niets
 * en zwijgt de code. `validate-i18n.mjs` vergelijkt deze sleutels daarom met de namen
 * in dat bestand.
 *
 * Een waarde is een tekst, of — voor een taal met naamvallen — een object. Zie
 * `resolve()` hieronder voor waarom die tweede vorm er nu al in zit.
 */
const ARTICLES = {
  en: {
    Netherlands: 'the',
    'United Kingdom': 'the',
  },
  nl: {
    'Verenigde Staten': 'de',
    'Verenigd Koninkrijk': 'het',
  },
};

/**
 * Het meervoud, als de taal een regel heeft die altijd klopt.
 *
 * Het Engels heeft die: er komt een `s` achter. Het Nederlands niet — land/landen,
 * jaar/jaren, huishouden/huishoudens, en dat is geen regel maar drie regels met
 * uitzonderingen. Een taal die hier niet in staat, moet het meervoud dus meekrijgen
 * bij de aanroep, en `count()` weigert te raden.
 */
const PLURALS = {
  en: (one) => `${one}s`,
};

const ORDINALS = {
  /** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st. */
  en: (n) => {
    const lastTwo = n % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
    return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
  },
  /** 1e, 2e, 3e — zonder uitzonderingen, en zonder de 11-tot-13-val van het Engels. */
  nl: (n) => `${n}e`,
};

/**
 * De bezitsvorm van een landnaam.
 *
 * Alleen Engels, en dat is geen gat maar een constatering: het Nederlands heeft hier
 * geen vorm voor. "Finlands huishoudens" bestaat, maar niemand schrijft het; je
 * schrijft "de Finse huishoudens" of "de huishoudens in Finland". Dat is een andere
 * zin, geen ander woord, en een zin hoort in de zinsbouwer van die taal.
 *
 * Daarom staat hier geen `nl`. Wie `possessive()` met een taal aanroept die er geen
 * heeft, krijgt een foutmelding die dat zegt, in plaats van stilletjes een Engelse
 * genitief op een Nederlandse pagina.
 */
const POSSESSIVES = {
  en: (name, article) => (article ? `${article} ${name}'s` : `${name}'s`),
};

/**
 * Een lidwoord opzoeken, eventueel in een naamval.
 *
 * Nederlands en Engels kennen geen naamval op een landnaam, dus hier staat altijd een
 * tekst en gaat `grammaticalCase` nergens heen. Hij staat er toch, en met opzet: het
 * Duits is de volgende taal en zegt *in den Niederlanden* tegenover *in der Schweiz*
 * — het lidwoord verandert én de naam verandert. Zonder dit argument zou elke
 * aanroep in stap 2 en 3 geschreven worden zonder naamval, en dan moeten ze bij het
 * Duits allemaal opnieuw langs. Dat is precies de verspilling die dit plan op andere
 * plekken wél heeft opgelopen.
 *
 * Een Duitse regel ziet er dan zo uit, en deze functie kan hem al lezen:
 *
 *   'Niederlande': { article: { subject: 'die', dative: 'den' },
 *                    name:    { dative: 'Niederlanden' } }
 *
 * **Die tak is ongetest.** Er is geen Duits woordenbestand, dus er is niets om hem
 * tegen te meten. Hij is een vorm die klaarstaat, geen bewezen werking.
 */
function resolve(entry, grammaticalCase) {
  if (entry === undefined) return { article: null, name: null };
  if (typeof entry === 'string') return { article: entry, name: null };
  return {
    article: entry.article?.[grammaticalCase] ?? entry.article?.subject ?? null,
    name: entry.name?.[grammaticalCase] ?? null,
  };
}

const tableFor = (table, lang) => table[lang] ?? table[DEFAULT_LOCALE];

/**
 * Een landnaam met zijn lidwoord, als die taal er een voor dit land heeft.
 *
 * Zonder dit staat er "in Netherlands", en dat leest als een vertaalfout — wat het
 * ook is.
 */
export function withArticle(name, { lang = DEFAULT_LOCALE, capitalise = false, grammaticalCase = 'subject' } = {}) {
  const { article, name: inflected } = resolve(tableFor(ARTICLES, lang)[name], grammaticalCase);
  const word = inflected ?? name;
  if (!article) return word;
  return `${capitalise ? article[0].toUpperCase() + article.slice(1) : article} ${word}`;
}

/**
 * "half of the Netherlands" leest raar; "half of Dutch households" niet.
 *
 * Gooit een fout voor een taal zonder bezitsvorm, in plaats van op het Engels terug
 * te vallen. Terugvallen zou hier een Engelse genitief midden in een Nederlandse zin
 * zetten, en dat is het soort fout dat niemand meldt omdat het er bijna goed uitziet.
 *
 * Op dit moment roept niets in de repo deze functie aan. Hij wordt geëxporteerd door
 * wealth.js en verder nergens gebruikt; dat is zo gebleven omdat het opruimen ervan
 * buiten deze opdracht valt.
 */
export function possessive(name, { lang = DEFAULT_LOCALE, grammaticalCase = 'subject' } = {}) {
  const build = POSSESSIVES[lang];
  if (!build) {
    throw new Error(
      `possessive(): ${lang} heeft geen bezitsvorm van een landnaam. Schrijf de zin ` +
        `anders in src/locales/${lang}/copy/ — bijvoorbeeld "de huishoudens in ${name}".`,
    );
  }
  const { article, name: inflected } = resolve(tableFor(ARTICLES, lang)[name], grammaticalCase);
  return build(inflected ?? name, article);
}

/**
 * Een aantal met zijn zelfstandig naamwoord: "3 countries", "1 country".
 *
 * `many` mag weg in een taal met een meervoudsregel die altijd klopt — in de praktijk
 * het Engels. In een taal zonder zo'n regel is weglaten een fout en geen keuze, dus
 * gooit deze functie dan. Raden zou "3 land" of "3 lands" opleveren, en dat is precies
 * het soort halve vertaling waar AdSense deze site op afwees.
 */
export function count(n, one, many, { lang = DEFAULT_LOCALE } = {}) {
  if (n === 1) return `${n} ${one}`;
  if (many !== undefined) return `${n} ${many}`;

  const rule = PLURALS[lang];
  if (!rule) {
    throw new Error(
      `count(): ${lang} heeft geen meervoudsregel, dus "${one}" heeft een meervoud ` +
        `nodig bij de aanroep: count(n, '${one}', '<meervoud>', { lang: '${lang}' }).`,
    );
  }
  return `${n} ${rule(one)}`;
}

/** 1st, 2nd, 3rd / 1e, 2e, 3e. */
export function ordinal(n, { lang = DEFAULT_LOCALE } = {}) {
  return tableFor(ORDINALS, lang)(n);
}

/**
 * Dezelfde vier functies, met één taal erin gebonden.
 *
 * Dit is wat de zinsbouwers per taal straks vragen: `const g = grammarOf('nl')` en
 * daarna `g.withArticle(name)`. Zo staat de taal één keer bovenaan het bestand in
 * plaats van bij elke aanroep, en kan een Nederlandse zinsbouwer per ongeluk geen
 * Engelse grammatica gebruiken.
 */
export function grammarOf(lang = DEFAULT_LOCALE) {
  return {
    lang,
    withArticle: (name, options = {}) => withArticle(name, { ...options, lang }),
    possessive: (name, options = {}) => possessive(name, { ...options, lang }),
    count: (n, one, many) => count(n, one, many, { lang }),
    ordinal: (n) => ordinal(n, { lang }),
  };
}

/** Welke talen hier een lidwoordtabel hebben. De poort vergelijkt dit met LOCALES. */
export const GRAMMAR_LANGUAGES = Object.keys(ARTICLES);

/** De namen die in deze taal een lidwoord dragen. Alleen voor de poort. */
export const articleNames = (lang) => Object.keys(ARTICLES[lang] ?? {});
