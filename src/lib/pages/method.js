/**
 * Alles wat de pagina /method/ uitrekent, los van de taal waarin hij het verwoordt.
 *
 * Elke metriekpagina verwijst hierheen voor het volledige verhaal. Elk getal komt uit de
 * gebouwde databestanden of uit de validatiebestanden die de poorten bij elke geslaagde
 * run wegschrijven — ook `maxDeviation`, dat tot 9 november 2026 met de hand in de pagina
 * stond.
 */
import { localise } from '../country-names.js';
import { headline, staleCountries } from '../leaving-home.js';
import { formatPeriod } from '../wealth.js';
import { upTo } from '../format.js';
import { methodology } from '../methodology.js';
import rawLeaving from '../../../data/leaving-home/index.json';
import rawWealth from '../../../data/wealth/index.json';
import wealthCheck from '../../../data/wealth-validation.json';
import rawExitAge from '../../../data/exit-age/index.json';

export function methodPage(lang) {
  /** De dertien datasets in de taal van deze pagina. Zie src/lib/methodology.js. */
  const sets = methodology(lang);
  const leaving = localise(rawLeaving, lang);
  const wealth = localise(rawWealth, lang);
  const exitAge = localise(rawExitAge, lang);

  return {
    sets,
    leaving,
    wealth,
    exitAge,
    wealthCheck,
    /**
     * De grootste afwijking van de balanscontrole, opgemaakt. Kwam als rúw getal uit het
     * validatiebestand en stond daardoor als "0.11%" op /nl/.
     */
    maxDeviation: upTo(wealthCheck.maxDeviation, 2, { locale: lang }),
    h: headline(leaving),
    stale: staleCountries(leaving),
    /**
     * Drie tellingen die vroeger vaste tekst waren. "This is the only one of our Eurostat
     * sources that is" klopte zolang alleen working-life een onafgebroken reeks had; met
     * de OECD-reeks erbij zijn het er twee, en met een derde zou de zin drie keer onwaar
     * zijn. En het aantal uitgevers stond als "two statistical agencies" in de tekst.
     */
    unbroken: sets.filter((set) => set.comparability.kind === 'unbroken'),
    definitions: sets.filter((set) => set.definition),
    publishers: [...new Set(sets.map((set) => set.publisher))],
    wealthPeriod: formatPeriod(wealth.latestPeriod),
  };
}
