/**
 * Alles wat het artikel over de reeksbreuk van 2021 uitrekent, los van de taal waarin het
 * dat verwoordt.
 *
 * De laatste pagina in de vorm van 3 november 2026, en de enige die lopende tekst is
 * zonder kaart, tabel-component of formulier.
 *
 * Geen enkel getal staat in het artikel met de hand: alles komt uit `break-story.js`, dat
 * uit `data/leaving-home/index.json` rekent. Deze lib maakt die getallen op in de taal van
 * de pagina — ook dat ging eerder mis, want ze gingen rúw de pagina in en droegen dus
 * altijd een punt.
 */
import { breakStory } from '../break-story.js';
import { methodology } from '../methodology.js';
import { decimal, upTo } from '../format.js';

export function noteBreakPage(lang) {
  const story = breakStory(lang);
  const sets = methodology(lang);

  /** Eén decimaal, in de notatie van deze taal. Het artikel schrijft niets anders. */
  const num = (value) => decimal(value, 1, { locale: lang });

  return {
    ...story,
    before: story.spreadAt(story.years.before),
    at: story.spreadAt(story.years.break),
    early: story.spreadAt('2005'),
    now: story.spreadAt(story.years.last),
    /** De metrieken met een eigen breuk, voor de sectie over waar het nog meer bijt. */
    elsewhere: sets.filter(
      (set) => set.comparability.kind === 'since' || set.comparability.kind === 'break-at-end',
    ),
    unbroken: sets.filter((set) => set.comparability.kind === 'unbroken'),
    num,
    /**
     * Tot één decimaal, zonder nul achteraan. Drie plekken in het artikel rekenden
     * `Math.round(x * 10) / 10` en zetten dat rúw in de zin, dus met een punt. `upTo()`
     * geeft precies dezelfde tekst in het Engels ("1.9", "2") en een komma in het
     * Nederlands; `num()` zou er "2,0" van maken en dat stond er niet.
     */
    loose: (value) => upTo(value, 1, { locale: lang }),
    /**
     * Een verschuiving met zijn teken, en zonder teken bij nul. Stond in de tabel als
     * drie losse expressies naast elkaar; het is één getal en hoort één functie te zijn.
     */
    shift: (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${num(Math.abs(value))}`,
  };
}
