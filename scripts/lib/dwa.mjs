/**
 * ECB Distributional Wealth Accounts — configuratie en woordenlijst.
 *
 * Waarom deze bron en niet HFCS: de HFCS-microdata vereist een formele aanvraag bij
 * de ECB (paspoort, cv, aanvraagformulier) en ververst eens per drie a vier jaar.
 * DWA is vrij opvraagbaar via de API en komt elk kwartaal uit. Wat we ervoor
 * inleveren is de leeftijdsindeling; wat we ervoor terugkrijgen is actualiteit en
 * een indeling naar woonsituatie en werkstatus, die voor vermogen meer zegt dan
 * leeftijd.
 *
 * BELANGRIJKE BEPERKING — lees dit voordat je iets bouwt dat een percentiel belooft:
 * DWA publiceert per groep het GEMIDDELDE, niet de GRENS van die groep. We kennen
 * dus het gemiddelde vermogen van het zevende deciel, maar niet waar het zevende
 * deciel begint. Een uitspraak als "je zit op het 63e percentiel" is daarom niet te
 * onderbouwen. Wat wel mag: de mediaan (die publiceert DWA exact) en "jouw bedrag
 * ligt tussen het gemiddelde van deciel X en dat van deciel Y".
 */

export const API = 'https://data-api.ecb.europa.eu/service/data/DWA';

/**
 * Sleutel: FREQ.REF_AREA.REF_SECTOR.ACCOUNT_ENTRY.STO.INSTR_ASSET.DWA_GRP.UNIT_MEASURE.VALUATION.TRANSFORMATION
 *
 * Let op ACCOUNT_ENTRY: bezittingen staan onder `A` (Assets), maar netto vermogen
 * onder `N` (Net = assets minus liabilities). Een sleutel met alleen `A` levert
 * stilzwijgend alles op behalve het belangrijkste cijfer.
 */
export const SERIES_KEY = 'Q..S14..LE.....';
export const START_PERIOD = '2023-Q1';

export const RAW_DIR = new URL('../../data/raw/dwa/', import.meta.url);
export const OUT_DIR = new URL('../../data/wealth/', import.meta.url);

/** De 21 landen. I9 en I10 zijn eurozone-aggregaten en horen niet in de landenlijst. */
export const AGGREGATES = ['I9', 'I10'];

export const COUNTRIES = {
  AT: 'Austria', BE: 'Belgium', CY: 'Cyprus', DE: 'Germany', EE: 'Estonia',
  ES: 'Spain', FI: 'Finland', FR: 'France', GR: 'Greece', HR: 'Croatia',
  HU: 'Hungary', IE: 'Ireland', IT: 'Italy', LT: 'Lithuania', LU: 'Luxembourg',
  LV: 'Latvia', MT: 'Malta', NL: 'Netherlands', PT: 'Portugal', SI: 'Slovenia',
  SK: 'Slovakia',
};

/**
 * De balansposten, in de taal van de bezoeker.
 *
 * Deze set telt exact op tot het netto vermogen — geverifieerd, zie
 * validate-wealth.mjs. Twee valkuilen zitten erin verwerkt:
 *
 *  - Schulden staan in DWA als NEGATIEVE bedragen. Netto vermogen is dus de SOM
 *    van alles hieronder, niet bezit min schuld.
 *  - F5, F51 en F_NNA zijn optelposten (F5 = F511 + F51M + F52, F_NNA = de schulden).
 *    Die horen er niet bij, anders tel je dubbel.
 */
export const INSTRUMENTS = {
  NUN: { label: 'Property and other non-financial assets', short: 'property', side: 'asset', order: 1 },
  NUB: { label: 'Business wealth', short: 'business', side: 'asset', order: 2 },
  F62: { label: 'Pensions and insurance', short: 'pensions', side: 'asset', order: 3 },
  F2M: { label: 'Cash and deposits', short: 'deposits', side: 'asset', order: 4 },
  F52: { label: 'Investment funds', short: 'funds', side: 'asset', order: 5 },
  F511: { label: 'Listed shares', short: 'listed shares', side: 'asset', order: 6 },
  F51M: { label: 'Unlisted shares and other equity', short: 'other equity', side: 'asset', order: 7 },
  F3: { label: 'Bonds', short: 'bonds', side: 'asset', order: 8 },
  F4B: { label: 'Debt secured on property', short: 'mortgage debt', side: 'liability', order: 9 },
  F4X: { label: 'Other debt', short: 'other debt', side: 'liability', order: 10 },
};

/** Optelposten die we nooit meenemen in een som — ze bevatten andere posten. */
export const AGGREGATE_INSTRUMENTS = ['F5', 'F51', 'F_NNA', 'NWA', 'ADA'];

export const assetCodes = () =>
  Object.entries(INSTRUMENTS).filter(([, m]) => m.side === 'asset').map(([c]) => c);
export const liabilityCodes = () =>
  Object.entries(INSTRUMENTS).filter(([, m]) => m.side === 'liability').map(([c]) => c);

/** Vermogensgroepen. Let op: dit zijn groepsgemiddelden, geen grenzen. */
export const WEALTH_GROUPS = [
  { code: 'B50', label: 'Bottom 50%', kind: 'range', from: 0, to: 50 },
  { code: 'Q1', label: 'Bottom 20%', kind: 'quintile', from: 0, to: 20 },
  { code: 'Q2', label: '2nd 20%', kind: 'quintile', from: 20, to: 40 },
  { code: 'Q3', label: 'Middle 20%', kind: 'quintile', from: 40, to: 60 },
  { code: 'Q4', label: '4th 20%', kind: 'quintile', from: 60, to: 80 },
  { code: 'Q5', label: 'Top 20%', kind: 'quintile', from: 80, to: 100 },
  { code: 'D6', label: '6th decile', kind: 'decile', from: 50, to: 60 },
  { code: 'D7', label: '7th decile', kind: 'decile', from: 60, to: 70 },
  { code: 'D8', label: '8th decile', kind: 'decile', from: 70, to: 80 },
  { code: 'D9', label: '9th decile', kind: 'decile', from: 80, to: 90 },
  { code: 'D10', label: 'Top 10%', kind: 'decile', from: 90, to: 100 },
];

/** Groepen die niets met vermogenspositie te maken hebben maar met levenssituatie. */
export const STATUS_GROUPS = [
  { code: 'HSO', label: 'Homeowners', family: 'housing' },
  { code: 'HST', label: 'Renters', family: 'housing' },
  { code: 'WSE', label: 'Employees', family: 'work' },
  { code: 'WSS', label: 'Self-employed', family: 'work' },
  { code: 'WSR', label: 'Retired', family: 'work' },
  { code: 'WSU', label: 'Unemployed', family: 'work' },
  { code: 'WSX', label: 'Other', family: 'work' },
];

/**
 * Eenheden en hun schaal — geverifieerd tegen de API, niet aangenomen:
 *
 *   EUR_MD / EUR_MN  absolute euro's   (NL-mediaan = 231.763 EUR)
 *   EUR_R_NH         DUIZENDEN euro's per huishouden (NL-huiseigenaren = 801,009 -> 801.009 EUR)
 *   EUR              MILJOENEN euro's, totaal voor de groep — tonen we nooit
 *   PT               percentage
 *
 * De schaalcontrole staat in validate-wealth.mjs en moet slagen voordat er iets
 * gepubliceerd wordt. Een factor 1000 fout is hier onzichtbaar en fataal.
 */
export const UNITS = {
  PER_HOUSEHOLD: 'EUR_R_NH',
  MEDIAN: 'EUR_MD',
  MEAN: 'EUR_MN',
  GINI: 'GI',
  SHARE: 'PT',
};

/** EUR_R_NH staat in duizenden; alles wat we tonen rekenen we hiermee naar euro's. */
export const PER_HOUSEHOLD_SCALE = 1000;

/** CSV-parser die aanhalingstekens respecteert — de omschrijvingsvelden bevatten komma's. */
export function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
