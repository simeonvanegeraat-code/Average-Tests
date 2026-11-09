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

  /**
   * Alleen de velden teruggeven die er ook waren.
   *
   * De landen in `data/wealth/index.json` dragen geen `status` en geen `composition` —
   * alleen de losse landbestanden doen dat. Een onvoorwaardelijke `{ ...country, status,
   * composition }` zette daar `"status":[],"composition":{}` bij, en dat bestand gaat in
   * zijn geheel de browser in: 609 bytes aan leegte in elke paginalading van /wealth/, in
   * beide talen.
   */
  return {
    ...country,
    groups,
    ...(country.status ? { status } : {}),
    ...(country.composition ? { composition } : {}),
  };
}

/**
 * `data/wealth/index.json` in de taal van de pagina.
 *
 * Dit bestand draagt per land een `groups`-lijst met dezelfde Engelse labels, en het gaat
 * in zijn geheel de browser in: /wealth/ serialiseert het in een JSON-blok en rekent de
 * vergelijking daar. Zonder deze lus las de uitkomstzin "It sits between what the bottom
 * 20% of households own" — op een Nederlandse pagina, berekend in de browser.
 */
export function localiseWealthIndex(index, lang) {
  return {
    ...index,
    countries: (index.countries ?? []).map((country) => localiseWealthCountry(country, lang)),
    euroArea: index.euroArea ? localiseWealthCountry(index.euroArea, lang) : index.euroArea,
  };
}

/**
 * De leeftijdsbanden van de ECB-enquête in de taal van de pagina.
 *
 * **Op drie plekken, en dat is geen overdaad.** Dit bestand draagt dezelfde banden drie
 * keer: als lijst bovenaan (`index.bands`, waar de tabelkoppen en `peaksByBand()` uit
 * lezen), per land (`countries[].bands`, waar `curveOf()` uit leest) en nog eens voor de
 * eurozone (`euroArea.bands`, waar de kop van /wealth/by-age/ aan hangt). Ik had alleen
 * de landen gedaan, en het resultaat was één pagina met "16 tot 34" in de tabelkoppen en
 * "55 to 64" in de kop erboven — half vertaald is erger dan niet vertaald, want dan lijkt
 * het een keuze.
 */
export function localiseWealthAge(index, lang) {
  const words = wealthWords(lang);

  const rename = (bands) =>
    (bands ?? []).map((band) => ({ ...band, label: words.bands[band.code] ?? band.label }));

  return {
    ...index,
    bands: rename(index.bands),
    countries: (index.countries ?? []).map((country) => ({
      ...country,
      bands: rename(country.bands),
    })),
    euroArea: index.euroArea ? { ...index.euroArea, bands: rename(index.euroArea.bands) } : index.euroArea,
  };
}
