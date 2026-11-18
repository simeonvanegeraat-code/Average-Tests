/**
 * Het profiel van de bezoeker: één sleutel in localStorage, één object.
 *
 * Land, themakeuze en per pagina het getal dat je daar invulde staan in dezelfde sleutel.
 * Dat is de reden dat er maar één functie is om te schrijven, en dat die altijd
 * samenvoegt: wie het object vervangt wist wat een ander onderdeel er zette. Dat is
 * precies wat er zou gebeuren als de pagina `{ country, ... }` wegschrijft en daarmee
 * de themakeuze kwijtraakt.
 *
 * ELK GETAL ONDER DE NAAM VAN ZIJN PAGINA
 *
 * Wat erin staat: `country`, `theme`, en één veld per pagina die om een getal vraagt —
 * `leaving-home`, `household-size`, `working-hours` enzovoort (de sleutel van de
 * metriek), plus `wealth-age` voor de leeftijd op /wealth/. Het bedrag op /wealth/ staat
 * er nooit in.
 *
 * Er is met opzet geen gedeeld `age`. Dat was er tot 15 november 2026, en twee pagina's
 * schreven ernaar met elk een andere betekenis: /leaving-home/ de leeftijd waarop je het
 * huis uit ging, /wealth/ de leeftijd die je nu hebt. De ene pagina zette het getal van
 * de andere terug en rekende er een uitslag op uit. Een oud `age` dat nog in iemands
 * browser staat wordt daarom nergens meer gelezen. Vraagt een nieuwe pagina om een getal,
 * geef het dan een eigen naam; deel alleen wat op elke pagina hetzelfde betekent.
 *
 * Het blijft geen account. De opslag staat op het apparaat van de bezoeker, verlaat de
 * browser niet en er is geen server. De privacypagina zegt dat, en moet bijgewerkt
 * worden zodra er iets bijkomt dat er nu nog niet staat (thema, verkende stops).
 *
 * Alles hier mislukt stil: in een privévenster of met geblokkeerde opslag werkt de
 * pagina gewoon zonder onthouden. De opslag is een parameter zodat dit zonder browser
 * te testen is.
 */
export const PROFILE_KEY = 'humanaverage:profile';

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Sommige browsers gooien al bij het opvragen van localStorage.
    return null;
  }
}

/** Het opgeslagen profiel, of een leeg object. Gooit nooit. */
export function readProfile(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(PROFILE_KEY);
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

/** Voegt `patch` samen met wat er staat (oppervlakkig) en bewaart het. Geeft het samengevoegde profiel terug. */
export function mergeProfile(patch, storage = defaultStorage()) {
  const merged = { ...readProfile(storage), ...patch };
  try {
    storage?.setItem(PROFILE_KEY, JSON.stringify(merged));
  } catch {
    // Opslag vol of geblokkeerd: de keuze geldt dan alleen voor deze pagina.
  }
  return merged;
}

/** Wist het profiel. Dit is wat "you can clear it at any time" in de tekst waarmaakt. */
export function clearProfile(storage = defaultStorage()) {
  try {
    storage?.removeItem(PROFILE_KEY);
  } catch {
    // Niets aan te doen.
  }
}
