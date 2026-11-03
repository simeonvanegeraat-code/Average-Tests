/**
 * Alles wat de pagina /leaving-home/ uitrekent, los van de taal waarin hij het verwoordt.
 *
 * WAAROM DIT BESTAAT
 *
 * Deze pagina bestaat in twee talen, en op 3 november 2026 is besloten dat elke taal zijn
 * eigen paginabestand krijgt in plaats van één bestand dat zinnen uit een woordenbestand
 * samenstelt. De reden is de kwaliteit van de tekst: een Nederlandse zin is niet een
 * Engelse zin met andere woorden erin, en een sjabloon met gaten dwingt hem toch in die
 * vorm.
 *
 * De prijs van die keuze is dubbel werk, en dit bestand is de helft die níét dubbel
 * wordt. **Eén plek rekent, twee plekken verwoorden.** Zonder deze scheiding zou een
 * verversing van Eurostat op twee plekken moeten worden nagelopen, en zou CLAUDE.md
 * regel 5 — geen getal met de hand in een pagina — op twee plekken kunnen breken.
 *
 * Wat hier dus níét staat: een zin, een kop, een titel. Die horen in de paginabestanden,
 * want dat is precies wat per taal verschilt.
 */
import { localise } from '../country-names.js';
import { localiseMetric } from '../metric-names.js';
import { clientData } from '../leaving-home-copy.js';
import { headline, trend } from '../leaving-home.js';
import baseMetric from '../metrics/leaving-home.js';
import rawIndex from '../../../data/leaving-home/index.json';

export function leavingHomePage(lang) {
  /**
   * De landnamen en de metriekwoorden in de taal van de pagina, vóórdat enig onderdeel
   * de index ziet. `locale` in de metriekbeschrijving zegt format.js hoe een getal eruit
   * moet zien, en reist zo ook mee naar de browser.
   */
  const index = localise(rawIndex, lang);
  const metric = { ...localiseMetric(baseMetric, lang), locale: lang };

  const h = headline(index);
  const movement = trend(index);

  /** Alleen wat de browser nodig heeft. Dubbele backslash: met één doet dit niets. */
  const clientJson = JSON.stringify(clientData(index, lang)).replace(/</g, '\\u003c');

  /**
   * Portugal draagt het breukjaar het duidelijkst: 28,9 in 2019, 33,3 in 2021, 30,1 in
   * 2022. Beide taalversies gebruiken dat voorbeeld, dus het land wordt hier opgezocht
   * en niet in de pagina — anders zoeken twee bestanden hetzelfde land op en kan er één
   * verlopen.
   */
  const portugal = index.countries.find((country) => country.code === 'PT') ?? null;

  return { index, metric, h, movement, clientJson, portugal };
}
