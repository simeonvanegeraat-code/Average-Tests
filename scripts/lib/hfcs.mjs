/**
 * De ECB Household Finance and Consumption Survey, voor zover wij hem gebruiken:
 * netto vermogen naar leeftijd van de referentiepersoon, per land.
 *
 * **Waarom dit naast DWA staat en er niet in opgaat.** De site toont op /wealth/ de
 * Distributional Wealth Accounts: kwartaalcijfers uit de nationale rekeningen, actueel,
 * maar zonder enige leeftijdsindeling (29 groepen, allemaal vermogensdecielen,
 * woonsituatie of werkstatus). De HFCS is een enquête die wél naar leeftijd uitsplitst,
 * maar die eens per drie jaar verschijnt en — belangrijker — iets anders meet:
 * **publieke en bedrijfspensioenen tellen niet mee.** Dezelfde uitgever, dezelfde
 * grootheid, een andere uitkomst: de mediaan voor Ierland is €437k in DWA en €258k hier,
 * voor Kroatië andersom (€59k tegen €117k).
 *
 * Daarom rekent de leeftijdslaag volledig binnen deze bron: eigen totaalmediaan, eigen
 * leeftijdsmedianen. Een cijfer hieruit mag nooit in dezelfde zin staan als een cijfer
 * uit DWA.
 *
 * **Waarom er geen API-aanroep in zit.** De ECB publiceert deze tabellen niet op zijn
 * data-API — gecontroleerd op 31 oktober 2026: van de 106 stromen is er geen HFCS. Ze
 * staan als zip met één xlsx erin op de website. Die zip is dus de bron, en
 * scripts/lib/xlsx.mjs leest hem.
 */
import { COUNTRIES } from './dwa.mjs';

export const ORIGIN = 'https://www.ecb.europa.eu';
export const INDEX_URL = `${ORIGIN}/stats/ecb_surveys/hfcs/html/index.en.html`;

export const RAW_DIR = new URL('../../data/raw/hfcs/', import.meta.url);
export const OUT_DIR = new URL('../../data/wealth-age/', import.meta.url);

/**
 * De tabbladen die we lezen. De namen in het bestand zijn afgekapt op 31 tekens
 * (een limiet van Excel), dus we zoeken op het begin ervan.
 */
export const SHEETS = {
  medians: 'A3',
  means: 'A4',
  fieldwork: 'Reference periods',
};

/**
 * De zes leeftijdsgroepen, precies zoals het tabblad ze schrijft. `from` en `to` zijn
 * er om een ingevulde leeftijd in een groep te plaatsen; de bovenste groep heeft geen
 * bovengrens.
 */
export const AGE_BANDS = [
  { code: '16-34', from: 16, to: 34, label: '16 to 34' },
  { code: '35-44', from: 35, to: 44, label: '35 to 44' },
  { code: '45-54', from: 45, to: 54, label: '45 to 54' },
  { code: '55-64', from: 55, to: 64, label: '55 to 64' },
  { code: '65-74', from: 65, to: 74, label: '65 to 74' },
  { code: '75+', from: 75, to: null, label: '75 and over' },
];

/**
 * De landnamen komen uit de DWA-spec en niet uit een eigen lijstje. Dat is geen
 * zuinigheid: dezelfde landkaart draagt straks op één pagina een cijfer uit beide
 * bronnen, en twee lijsten die uit elkaar lopen geven "Czechia" naast "Czech Republic"
 * zonder dat iets omvalt.
 */
export { COUNTRIES };

/** Hoe de eurozonekolom in het tabblad heet, en onder welke code wij hem bewaren. */
export const EURO_AREA = { header: /^euro area$/i, code: 'EA', name: 'Euro area' };

/**
 * Landen die de HFCS wél heeft en wij niet bouwen.
 *
 * Tsjechië zit in de tabellen maar niet op onze vermogenspagina's, omdat DWA alleen de
 * eurozone dekt. Het zou een leeftijdscijfer krijgen zonder cijfer voor vandaag ernaast,
 * en dat is een halve pagina. Apart uit te zoeken; niet stilzwijgend weglaten.
 */
export const NOT_BUILT = {
  CZ: 'Zit in de HFCS maar niet in DWA (geen eurozone), dus geen actueel cijfer om naast te zetten.',
};

/** Het pad van de zip met de nieuwste golf, uit de HTML van de indexpagina. */
export function findLatestWaveZip(html) {
  const paden = [...new Set([...html.matchAll(/[^"'\s]*HFCS_Statistical_Tables_Wave[^"'\s]*\.zip/g)].map((m) => m[0]))];
  if (paden.length === 0) {
    throw new Error(
      'Geen zip met statistische tabellen gevonden op de HFCS-indexpagina.\n' +
      `Controleer ${INDEX_URL} — de ECB heeft de pagina of de bestandsnaam veranderd.`,
    );
  }

  const golven = paden
    .map((pad) => ({ pad, golf: Number(/Wave_?(\d{4})/.exec(pad)?.[1] ?? 0) }))
    .sort((a, b) => b.golf - a.golf);

  if (golven[0].golf === 0) throw new Error(`Geen golfjaar te lezen uit: ${golven[0].pad}`);
  return { pad: golven[0].pad, wave: golven[0].golf, alle: golven };
}

/** "01/23" uit het tabblad met veldwerkperiodes wordt "2023-01". */
export function fieldworkPeriod(cel) {
  const m = /^(\d{2})\/(\d{2})$/.exec(String(cel).trim());
  if (!m) return null;
  return `20${m[2]}-${m[1]}`;
}

/**
 * De grenzen waarbuiten een bedrag niet kan kloppen, in euro's. Ruim genomen: het
 * hoogste dat er nu staat is €1,2 mln (Luxemburg, 75+) en het laagste €6k (Finland,
 * 16-34). Deze poort vangt een factor 1000, niet een verschuiving van tien procent.
 */
export const PLAUSIBLE = { min: 1_000, max: 5_000_000 };

/** De tabellen staan in duizenden euro's. Eén plek, zodat de schaal niet twee keer geraden wordt. */
export const SCALE = 1000;
