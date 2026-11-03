/**
 * Wie deze site is, in structured data, op één plek.
 *
 * Drie pagina's beschrijven dezelfde twee dingen: de site en de organisatie erachter.
 * De voordeur zegt het als `WebSite` met een `publisher`, het artikel als `author` en
 * `publisher`, en `/about/` als `isPartOf` plus een `mainEntity` met e-mailadres en
 * oprichter. Zonder `@id` zijn dat **vijf losse knopen** die toevallig dezelfde naam
 * dragen, en een zoekmachine mag er vijf organisaties in lezen.
 *
 * Dat was ook precies zo: de review van PR #37 vond dat de `WebSite` van de voordeur
 * en de `WebSite` in `isPartOf` van `/about/` beide naamloos waren. Met één `@id` zijn
 * ze één knoop, en vult elke pagina er een stukje van in.
 *
 * TWEE DINGEN DIE HIER GEEN TOEVAL ZIJN
 *
 * **De oorsprong komt uit `Astro.site`** (`astro.config.mjs`), die als tweede argument
 * meekomt. Een lib kan `Astro` niet lezen, en de URL intypen zou een tweede waarheid
 * naast die config zetten — dat is hoe de drie blokken hierboven aan hun hardgecodeerde
 * `https://www.humanaverage.com/` kwamen.
 *
 * **De `@id` draagt het taalvoorvoegsel.** Elke taalversie is dus zijn eigen `WebSite`:
 * `…/#website` en `…/nl/#website`. Dat is met opzet, want een `WebSite` draagt een
 * `inLanguage`, en één knoop voor beide talen zou over de ene taal liegen. De pagina's
 * van een taal verwijzen onderling naar dezelfde knoop; dát is wat er één hoort te zijn.
 */
import { prefixOf } from './locales.js';

/**
 * De URL van een pagina in de taal van die pagina.
 *
 * Dezelfde berekening die `BaseV2.astro` voor de canonical doet. Een pagina die zijn
 * eigen URL in structured data nodig heeft, hoort hem niet anders uit te rekenen dan
 * de canonical in zijn eigen `<head>` — dat zijn twee beweringen over één pagina.
 */
export const pageUrl = (path, lang, site) => new URL(`${prefixOf(lang)}${path}`, site).href;

/**
 * De site en de organisatie als knopen met een `@id`.
 *
 * `website` en `organisation` zijn volledige beschrijvingen; `ref()` geeft alleen de
 * `@id`, voor een plek waar je naar de knoop wijst in plaats van hem te beschrijven
 * (een `publisher`, een `author`). Twee keer dezelfde knoop volledig beschrijven mag in
 * JSON-LD, maar dan staan er twee beschrijvingen die uiteen kunnen lopen.
 */
export function siteIdentity(lang, site) {
  const url = new URL(`${prefixOf(lang)}/`, site).href;

  return {
    url,
    website: {
      '@type': 'WebSite',
      '@id': `${url}#website`,
      name: 'HumanAverage',
      url,
      inLanguage: lang,
    },
    organisation: {
      '@type': 'Organization',
      '@id': `${url}#organisation`,
      name: 'HumanAverage',
      url,
    },
    ref: (what) => ({ '@id': `${url}#${what}` }),
  };
}
