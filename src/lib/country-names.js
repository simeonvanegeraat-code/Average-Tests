/**
 * De taalgrens voor landnamen.
 *
 * De naam van een land staat in de data: elk record in `data/*​/index.json` heeft
 * `"name": "Finland"`, en `.name` wordt 250 keer gelezen in 34 bestanden. Die 250
 * plekken verbouwen voor een tweede taal is geen optie, dus gebeurt het hier: één
 * functie die de namen invult vóórdat enig onderdeel de index ziet.
 *
 * Twee codestelsels in één bestand. Eurostat gebruikt twee letters (`AT`), de OESO
 * drie (`AUT`), en `data/exit-age/` is een OESO-bron. Beide staan dus in
 * `countries.json`, met dezelfde naam erachter. Nagekeken bij het genereren: geen
 * enkele code draagt twee verschillende namen, over alle 103 codes in alle datasets.
 *
 * Wat deze functie NIET doet, is een ontbrekende naam leegmaken. Staat een code niet
 * in het woordenbestand, dan blijft de naam uit de data staan — de Engelse naam van
 * de uitgever is beter dan een lege cel, en `validate-i18n.mjs` is de plek die een
 * gat hoort te melden. Een gat dat zichtbaar wordt op de pagina is een gat dat te
 * laat gevonden is.
 *
 * Bekend gat, met opzet: `data/wealth/index.json` heeft naast `countries` ook een
 * losse `euroArea`, en die staat hier niet in. Dat veld draagt op dit moment `"I9"`
 * als naam — de ECB-gebiedscode, niet een naam — en dat is een fout in de pipeline,
 * niet iets om hier stil te repareren. Zolang die er is, zou een Nederlandse
 * vermogenspagina de verkeerde vraag stellen aan dit bestand.
 */
import { DEFAULT_LOCALE } from './locales.js';
/**
 * Met `with { type: 'json' }` erbij, waar catalogue.js een blote import doet.
 * Vite accepteert beide; plain Node alleen deze. Dat verschil is hier de moeite waard,
 * want het maakt deze grens buiten de bundler te testen — en een grens die je niet kunt
 * testen voordat de tweede taal er staat, test niemand.
 */
import en from '../locales/en/countries.json' with { type: 'json' };

/**
 * Eén woordenbestand per taal. Een taal erbij is een regel hier en een bestand
 * ernaast; verder verandert er niets.
 */
const NAMES = { en };

export function countryNames(lang) {
  return NAMES[lang] ?? NAMES[DEFAULT_LOCALE];
}

/** Eurostat noemt de sleutel `code`, de ECB `area`. */
const codeOf = (row) => row.code ?? row.area ?? null;

/**
 * Een index met de namen in de gevraagde taal.
 *
 * Geeft een nieuwe index terug en laat de ingelezen JSON ongemoeid: die module is
 * tussen pagina's gedeeld, en erin schrijven zou de ene pagina de taal van de andere
 * geven. Alleen `name` verandert; al het andere is dezelfde waarde.
 *
 * Rijen worden nergens op identiteit vergeleken — alle vergelijkingen in deze repo
 * gaan over `.code` — dus een kopie is hier veilig. Nagekeken op 1 november 2026.
 */
export function localise(index, lang = DEFAULT_LOCALE) {
  const names = countryNames(lang);

  const rename = (row) => {
    const name = names[codeOf(row)];
    return name === undefined || name === row.name ? row : { ...row, name };
  };

  const localised = { ...index };
  for (const group of ['countries', 'aggregates']) {
    if (Array.isArray(index[group])) localised[group] = index[group].map(rename);
  }

  /**
   * **Losse gebieden gaan hier opzettelijk niet door.** De ECB zet de eurozone niet in
   * `aggregates` maar als eigen sleutel (`euroArea`, in data/wealth/ en data/wealth-age/
   * beide), en de verleiding is om die net zo te hernoemen. Op 1 november 2026 heb ik dat
   * gedaan en het was fout: `/wealth/by-age/` ging van "Euro area" naar "Euro area
   * (EA11-1999, EA12-2001, …, EA21-2026)".
   *
   * De oorzaak zit in het woordenbestand, niet in de lus. Dat bestand is één naam per
   * code, en code `EA` draagt twee gepubliceerde namen: Eurostat schrijft in
   * data/household-size/ dat lange historische label, de ECB in data/wealth-age/
   * schrijft "Euro area". Voor landen is één naam per code waar; voor aggregaten
   * hangt de naam van de uitgever af. Dat conflict blijft onzichtbaar zolang de twee
   * in verschillende vormen staan — de een in een array, de ander als losse sleutel —
   * en build-locale-names.mjs leest alleen de arrays.
   *
   * Zo'n gebiedsnaam is dan ook geen landnaam. Het is een woord van de pagina
   * ("Eurozone", "EU27"), en die horen in het woordenbestand van de tekst, waar één
   * pagina zijn eigen label kiest. Daar gaat fase 3 ze neerzetten; hier niet.
   */

  return localised;
}
