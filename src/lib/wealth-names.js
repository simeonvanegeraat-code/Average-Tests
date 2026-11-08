/**
 * De woorden van de vermogensdata, per taal.
 *
 * De pipeline schrijft Engelse labels in de databestanden: "Middle 20%", "Homeowners",
 * "Property and other non-financial assets", "75 and over". Die stonden daardoor ook op
 * /nl/wealth/ en op de 21 landpagina's, met de getallen al in Nederlandse notatie ernaast.
 *
 * Dezelfde grens als `localise()` voor landnamen en `localiseMetric()` voor
 * metriekwoorden: vul de woorden in vóórdat een pagina of onderdeel het object ziet, zodat
 * geen enkele leesplek verandert. `g.label` blijft `g.label`.
 *
 * De labels staan op code, niet op positie — `Q3` is overal "Middelste 20%", ook als de
 * ECB de rij ooit ergens anders zet. Wat de uitgever zélf publiceert (de naam van de
 * enquête, zijn definitie) wordt niet vertaald; besluit 1 van 1 november.
 */
import { DEFAULT_LOCALE } from './locales.js';
import en from '../locales/en/wealth.json';
import nl from '../locales/nl/wealth.json';

/** Een taal erbij is een import hierboven en een sleutel hier. */
const WORDS = { en, nl };

export const WEALTH_LANGUAGES = Object.keys(WORDS);

export const wealthWords = (lang) => WORDS[lang] ?? WORDS[DEFAULT_LOCALE];

/**
 * Een landbestand uit data/wealth/<code>.json in de taal van de pagina.
 *
 * Laat een code waarvoor geen woord bestaat staan zoals hij is, in plaats van hem leeg te
 * maken: een nieuwe uitsplitsing van de ECB hoort zichtbaar te zijn als onvertaald, niet
 * te verdwijnen.
 */
export function localiseWealthCountry(country, lang) {
  const words = wealthWords(lang);

  const groups = (country.groups ?? []).map((group) => ({
    ...group,
    label: words.groups[group.code] ?? group.label,
  }));

  const status = (country.status ?? []).map((entry) => ({
    ...entry,
    label: words.status[entry.code] ?? entry.label,
  }));

  const composition = Object.fromEntries(
    Object.entries(country.composition ?? {}).map(([key, parts]) => [
      key,
      parts.map((part) => {
        const word = words.composition[part.code];
        return word ? { ...part, label: word.label, short: word.short } : part;
      }),
    ]),
  );

  return { ...country, groups, status, composition };
}

/** De leeftijdsbanden van de ECB-enquête, per land, in de taal van de pagina. */
export function localiseWealthAge(index, lang) {
  const words = wealthWords(lang);

  return {
    ...index,
    countries: (index.countries ?? []).map((country) => ({
      ...country,
      bands: (country.bands ?? []).map((band) => ({
        ...band,
        label: words.bands[band.code] ?? band.label,
      })),
    })),
  };
}
