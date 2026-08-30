/**
 * Dunne laag om Plausible heen.
 *
 * Plausible is cookieloos en EU-gehost, dus er is geen toestemmingsbanner nodig.
 * Zodra er advertenties bijkomen verandert dat wel: Google eist dan een
 * gecertificeerde CMP voor EER/VK-verkeer. Zie CLAUDE.md.
 *
 * Het script is nu nog niet geladen (het account moet nog worden aangemaakt).
 * Deze wrapper doet dan niets, zodat de eventnamen vanaf dag één in de code
 * staan en er later alleen een scripttag bij hoeft.
 *
 * Eventnamen liggen vast in CLAUDE.md. Wijzig ze niet stilletjes: de MVP-meting
 * hangt eraan.
 */
export function track(event, props) {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.plausible === 'function') {
      window.plausible(event, props ? { props } : undefined);
    }
  } catch {
    // Meten mag de pagina nooit stukmaken.
  }
}

export const EVENTS = {
  valueSubmitted: 'value_submitted',
  resultShared: 'result_shared',
  secondMetricOpened: 'second_metric_opened',
  methodologyOpened: 'methodology_opened',
};
