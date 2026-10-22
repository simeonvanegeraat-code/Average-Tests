/**
 * Het profiel van de bezoeker: één sleutel in localStorage, één object.
 *
 * Land, leeftijd, themakeuze en (later) welke stops je zag staan in dezelfde sleutel.
 * Dat is de reden dat er maar één functie is om te schrijven, en dat die altijd
 * samenvoegt: wie het object vervangt wist wat een ander onderdeel er zette. Dat is
 * precies wat er zou gebeuren als de pagina `{ country, age }` wegschrijft en daarmee
 * de themakeuze kwijtraakt.
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
