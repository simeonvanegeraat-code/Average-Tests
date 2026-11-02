/**
 * Welke talen de site kent, en hoe een taal zich tot een URL verhoudt.
 *
 * Eén lijst, en die lijst is de schakelaar. Zolang `LOCALES` alleen Engels bevat
 * bouwt de site precies de URL's die er altijd stonden: de route `[...lang]` krijgt
 * `undefined` en laat het segment dan weg. Zet er een taal bij, en elke pagina
 * verschijnt een tweede keer onder `/<taal>/` met een `hreflang` die ze aan elkaar
 * knoopt. Er is dus geen tweede boom met paginabestanden.
 *
 * De standaardtaal krijgt géén voorvoegsel, en dat is geen smaak. Elke bestaande URL
 * van deze site is Engels en staat zonder voorvoegsel; een site die zijn URL's
 * verplaatst begint zijn posities in Google opnieuw op te bouwen. Engels blijft op /.
 *
 * Het plan staat in research/i18n-plan.md.
 */
export const DEFAULT_LOCALE = 'en';

/**
 * Voeg hier een taal toe zodra zijn woordenbestand compleet is, niet eerder. Een
 * halfvertaalde pagina is precies de "content van weinig waarde" waarop AdSense deze
 * site op 25 oktober 2026 afwees.
 */
export const LOCALES = ['en'];

/** Het URL-voorvoegsel van een taal: '' voor de standaardtaal, '/nl' voor de rest. */
export const prefixOf = (lang) => (lang === DEFAULT_LOCALE ? '' : `/${lang}`);

/**
 * Een interne link in de taal van de pagina. `/method/` wordt `/nl/method/`.
 *
 * Dit is één regel en toch de kern van de tweede taal. Zonder deze functie zijn de
 * Nederlandse pagina's veertig doodlopende straten: elke link in de balk, het
 * megamenu en de voetregel stond zonder voorvoegsel, dus één klik en de bezoeker
 * staat weer op het Engels. Gemeten op 2 november 2026, vóór deze ronde: nul van de
 * 86 interne links droeg het voorvoegsel.
 *
 * De paden zelf blijven overal zonder voorvoegsel staan — in `catalogue.js`, in
 * `notes.js`, in de pagina's. Dat is bewust: de navigatie vergelijkt ze met `here`,
 * waar het voorvoegsel al af is, en de canonical bouwt erop. Eén plek zet het ervoor,
 * en dat is hier.
 *
 * Een anker mag mee (`/method/#datasets-title`): het voorvoegsel gaat ervóór, dus
 * het anker blijft waar het hoort.
 */
export const linkTo = (path, lang) => `${prefixOf(lang)}${path}`;

/**
 * De waarde voor de routeparameter `[...lang]`. Dat `undefined` is hier het punt: een
 * restparameter zonder waarde laat het segment weg, dus /leaving-home/ en niet
 * /en/leaving-home/.
 */
export const paramOf = (lang) => (lang === DEFAULT_LOCALE ? undefined : lang);

/** Wat elke pagina aan `getStaticPaths` teruggeeft: één pad per taal. */
export function localePaths() {
  return LOCALES.map((lang) => ({ params: { lang: paramOf(lang) } }));
}

/** De taal van een gebouwd pad. '/nl/wealth/' geeft 'nl', '/wealth/' geeft 'en'. */
export function localeOf(pathname) {
  const first = (pathname ?? '/').split('/').filter(Boolean)[0];
  return first && first !== DEFAULT_LOCALE && LOCALES.includes(first) ? first : DEFAULT_LOCALE;
}

/**
 * Elke taalversie van hetzelfde pad, voor `hreflang`. Leeg zolang er één taal is:
 * een hreflang-verzameling die alleen naar zichzelf wijst zegt niets, en door hem weg
 * te laten blijft de gebouwde HTML in deze fase gelijk aan die van main.
 */
export function alternatesOf(path) {
  if (LOCALES.length < 2) return [];
  return LOCALES.map((lang) => ({ lang, path: `${prefixOf(lang)}${path}` }));
}
