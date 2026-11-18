/**
 * Wat er aan een land opvalt, uit de ECB-kwartaalrekeningen (DWA).
 *
 * De 21 landpagina's onder /wealth/ deelden in november 2026 per paar 64% van hun tekst,
 * en de zin die ze uit elkaar moest houden ("het grootste bezit van het middelste
 * huishouden is …") was in alle 21 landen dezelfde: woningbezit, dan spaargeld. Dit
 * bestand zoekt de maten waarop een land wél verschilt van de andere twintig, zodat elke
 * pagina zegt wat alleen voor dát land waar is. Het plan staat in
 * research/wealth-country-pages-plan.md.
 *
 * Zuivere rekenkunde, zonder JSON-import en zonder taal: de pagina geeft de landbestanden
 * mee en verwoordt de uitkomst zelf. Daardoor kan ook een gewoon Node-script dit lezen.
 *
 * WAT HIER BEWUST NIET STAAT
 *
 *  - Geen percentiel. Elke maat is een verhouding tussen gepubliceerde getallen van één
 *    land, en de rang is de plek van dat land tussen 21 landen — niet van een huishouden
 *    tussen huishoudens.
 *  - Geen koopkracht. De groei is in euro's van het moment zelf; er staat geen prijsreeks
 *    in de repo.
 *  - Geen verklaring. De data zegt dat iets zo is, niet waarom.
 *  - Niets uit de enquête (HFCS). Les 5 uit CLAUDE.md: die bron staat op de pagina in
 *    een eigen sectie en komt hier niet in.
 */

/** De groepen en posten op code, zoals de pijplijn ze schrijft. */
const group = (country, code) => country.groups?.find((g) => g.code === code)?.netWealth ?? null;
const status = (country, code) => country.status?.find((s) => s.code === code)?.netWealth ?? null;

/** Het bezit van het middelste vijfde: alleen de posten aan de bezitskant. */
function middleAssets(country) {
  const parts = country.composition?.Q3 ?? [];
  const assets = parts.filter((p) => p.side === 'asset');
  const total = assets.reduce((sum, p) => sum + p.value, 0);
  return { parts, assets, total };
}

const share = (country, code) => {
  const { assets, total } = middleAssets(country);
  const part = assets.find((p) => p.code === code);
  return part && total > 0 ? part.value / total : null;
};

/**
 * De mediaan in twee kwartalen, alleen als beide er zijn. De vensters moeten voor elk land
 * gelijk zijn — les 4 uit CLAUDE.md: één ranglijst over verschillende perioden is geen
 * ranglijst. Nederland stopt in deze download in 2025-Q4 terwijl de meeste landen
 * 2026-Q1 hebben, dus het venster wordt berekend in `commonWindow()`.
 */
function medianAt(country, period) {
  return country.medianHistory?.find((h) => h.period === period)?.value ?? null;
}

/** Het laatste kwartaal dat élk land heeft, en het eerste. */
export function commonWindow(countries) {
  const firsts = countries.map((c) => c.medianHistory?.[0]?.period).filter(Boolean).sort();
  const lasts = countries.map((c) => c.medianHistory?.at(-1)?.period).filter(Boolean).sort();
  return { from: firsts.at(-1), to: lasts[0] };
}

/**
 * De maten. Elk heeft een richting nodig voor de zin ("de hoogste" of "de laagste"),
 * en die zit niet in de maat zelf maar in de rang; zie `rankOf()`.
 *
 * `value` geeft null als het land de uitsplitsing niet heeft (Portugal heeft geen
 * koop/huur, Nederland geen werkstatus). Zo'n land doet voor die maat niet mee, en de
 * noemer van de rang telt alleen de landen die hem wél hebben.
 */
export const MEASURES = [
  {
    key: 'meanToMedian',
    unit: 'times',
    value: (c) => (c.mean && c.median > 0 ? c.mean / c.median : null),
  },
  {
    key: 'ownersToRenters',
    unit: 'times',
    value: (c) => {
      const own = status(c, 'HSO');
      const rent = status(c, 'HST');
      return own !== null && rent > 0 ? own / rent : null;
    },
  },
  {
    /**
     * Het aandeel van de rijkste tien procent in al het vermogen. Een groepsgemiddelde
     * maal de omvang van de groep, gedeeld door het gemiddelde van iedereen: een afgeleide
     * som en geen schatting. De vijf vijfden tellen per land op tot 0,999–1,003 van het
     * gemiddelde; zie het plan, §3.
     */
    key: 'topTenShare',
    unit: 'percent',
    value: (c) => {
      const top = group(c, 'D10');
      return top !== null && c.mean > 0 ? (top * 0.1) / c.mean : null;
    },
  },
  {
    key: 'bottomHalfShare',
    unit: 'percent',
    value: (c) => {
      const half = group(c, 'B50');
      return half !== null && c.mean > 0 ? (half * 0.5) / c.mean : null;
    },
  },
  { key: 'housingShare', unit: 'percent', value: (c) => share(c, 'NUN') },
  { key: 'depositShare', unit: 'percent', value: (c) => share(c, 'F2M') },
  {
    key: 'debtToAssets',
    unit: 'percent',
    value: (c) => {
      const { parts, total } = middleAssets(c);
      const debt = parts.filter((p) => p.side === 'liability').reduce((sum, p) => sum + Math.abs(p.value), 0);
      return total > 0 ? debt / total : null;
    },
  },
  {
    key: 'growth',
    unit: 'percent',
    /** Krijgt het gemeenschappelijke venster mee; zie `commonWindow()`. */
    value: (c, window) => {
      const from = medianAt(c, window.from);
      const to = medianAt(c, window.to);
      return from > 0 && to !== null ? to / from - 1 : null;
    },
  },
];

/**
 * De plek van een land op één maat, vanaf het dichtstbijzijnde uiterste.
 *
 * `end` is 'high' of 'low'; `place` is 1 voor het uiterste zelf. `beyond` zijn de landen
 * die nog verder naar dat uiterste liggen (leeg als het land er zelf op staat), en `next`
 * het land of de landen direct aan de andere kant, zodat de pagina altijd buren bij naam
 * kan noemen.
 */
function rankOf(area, values) {
  const sorted = [...values].sort((a, b) => b.value - a.value || a.area.localeCompare(b.area));
  const i = sorted.findIndex((v) => v.area === area);
  const n = sorted.length;
  const fromHigh = i + 1;
  const fromLow = n - i;
  const end = fromHigh <= fromLow ? 'high' : 'low';
  const ordered = end === 'high' ? sorted : [...sorted].reverse();
  const at = end === 'high' ? i : n - 1 - i;
  return {
    end,
    place: at + 1,
    of: n,
    beyond: ordered.slice(0, at),
    next: ordered.slice(at + 1, at + (at === 0 ? 3 : 2)),
    /** 0 op een uiterste, 0,5 precies in het midden. */
    extremeness: n > 1 ? at / (n - 1) : 0.5,
  };
}

/**
 * Alle maten voor alle landen, en per land de maten waarop het het meest afwijkt.
 *
 * Kiezen gaat op de plek vanaf het uiterste, dan op de afstand tot de mediaan van de
 * maat, gemeten in de spreiding van die maat. Die tweede regel beslist alleen tussen
 * maten waarop een land even ver van het uiterste staat, en zorgt dat "tweede van 21" op
 * een maat waar de landen dicht opeen liggen niet wint van "tweede van 21" waar het land
 * er ver bovenuit steekt.
 *
 * @param countries de landbestanden uit data/wealth/<code>.json, zonder aggregaten
 * @param euroArea  het bestand van de eurozone (I9), alleen voor de vergelijking met het
 *                  middelste huishouden van de eurozone; het doet in geen rang mee
 * @returns `{ window, measures, byArea }`
 */
export function standsOut(countries, euroArea, { pick = 3 } = {}) {
  const window = commonWindow(countries);

  const measures = MEASURES.map((m) => {
    const values = countries
      .map((c) => ({ area: c.area, value: m.value(c, window) }))
      .filter((v) => v.value !== null && Number.isFinite(v.value));
    const sorted = values.map((v) => v.value).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const spread = sorted.at(-1) - sorted[0] || 1;
    return { ...m, values, median, spread };
  });

  const byArea = {};
  for (const c of countries) {
    const ranked = measures
      .map((m) => {
        const own = m.values.find((v) => v.area === c.area);
        if (!own) return null;
        return {
          key: m.key,
          unit: m.unit,
          value: own.value,
          distance: Math.abs(own.value - m.median) / m.spread,
          ...rankOf(c.area, m.values),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.extremeness - b.extremeness || b.distance - a.distance);

    byArea[c.area] = {
      picks: ranked.slice(0, pick),
      all: ranked,
      euroAreaGap: euroAreaGap(c, euroArea),
    };
  }

  return {
    window,
    measures,
    byArea,
    euroAreaGrowth: euroArea ? MEASURES.find((m) => m.key === 'growth').value(euroArea, window) : null,
  };
}

/**
 * De bezitspost waarop het middelste huishouden van dit land het meest afwijkt van het
 * middelste huishouden in de eurozone, in procentpunten van het eigen bezit. Dit vervangt
 * de zin "the largest holding is …", die in alle 21 landen hetzelfde antwoord gaf.
 *
 * Twee verdelingen van dezelfde bron en hetzelfde kwartaalbegrip, dus binnen les 5.
 */
function euroAreaGap(country, euroArea) {
  if (!euroArea) return null;
  const own = middleAssets(country);
  const ea = middleAssets(euroArea);
  if (!own.total || !ea.total) return null;
  let best = null;
  for (const part of own.assets) {
    const other = ea.assets.find((p) => p.code === part.code);
    if (!other) continue;
    const here = part.value / own.total;
    const there = other.value / ea.total;
    const gap = here - there;
    if (!best || Math.abs(gap) > Math.abs(best.gap)) best = { code: part.code, here, there, gap };
  }
  return best;
}

/** De buren op de mediaan: het land direct erboven en direct eronder. */
export function medianNeighbours(area, countries) {
  const sorted = [...countries].filter((c) => Number.isFinite(c.median)).sort((a, b) => b.median - a.median);
  const i = sorted.findIndex((c) => c.area === area);
  return { above: i > 0 ? sorted[i - 1] : null, below: i < sorted.length - 1 ? sorted[i + 1] : null };
}
