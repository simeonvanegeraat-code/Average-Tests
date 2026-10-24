/**
 * Elke Eurostat-metriek in één regel per stuk. scripts/lib/metric-build.mjs doet
 * het werk; hier staat alleen wat per dataset verschilt.
 *
 * `params` gaat mee in het verzoek en houdt het antwoord klein — bij `lfsa_ewhuis`
 * is dat geen luxe: ongefilterd verbreekt die de verbinding.
 *
 * `fixed` pint de dimensies die wél in het antwoord zitten maar waarvan we één
 * categorie willen. Staat een dimensie er niet in, dan neemt de bouwer de eerste.
 *
 * `split` zegt hoe mannen en vrouwen eruit komen. Meestal is dat de dimensie `sex`
 * met T/M/F, maar niet altijd — zie de trouwleeftijd onderaan.
 *
 * `plausible` is een bereik waarbuiten een waarde een fout moet zijn, niet een
 * verrassing. Het is een vangnet tegen schaal- en dimensiefouten, geen oordeel over
 * de data.
 */

const SEX = { dim: 'sex', total: 'T', men: 'M', women: 'F' };

export const METRICS = [
  {
    key: 'leaving-home',
    code: 'yth_demo_030',
    params: { unit: 'AVG' },
    split: SEX,
    expect: 'Estimated average age of young persons leaving the parental household',
    plausible: { min: 15, max: 40 },
  },
  {
    key: 'working-life',
    code: 'lfsi_dwl_a',
    params: {},
    split: SEX,
    expect: 'Duration of working life',
    plausible: { min: 20, max: 50 },
  },
  {
    key: 'household-size',
    code: 'ilc_lvph01',
    params: {},
    split: null,
    expect: 'Average household size',
    // Kosovo staat op 6,0 uit een enkele waarneming van 2018; zes personen per
    // huishouden is fysiek mogelijk, dus dit vangnet is er tegen schaalfouten en niet
    // tegen uitschieters. Zie de notitie bij deze metriek in data/sources.md.
    plausible: { min: 1.5, max: 7 },
  },
  {
    key: 'healthy-years',
    code: 'hlth_hlye',
    params: { unit: 'YR', hlth_hle: 'HLY_Y0' },
    fixed: { hlth_hle: 'HLY_Y0', unit: 'YR' },
    split: SEX,
    expect: 'Healthy life years',
    plausible: { min: 45, max: 80 },
  },
  {
    key: 'working-hours',
    code: 'lfsa_ewhuis',
    params: { unit: 'HR', age: 'Y20-64', worktime: 'TOTAL', wstatus: 'EMP', isco08: 'TOTAL' },
    fixed: { unit: 'HR', age: 'Y20-64', worktime: 'TOTAL', wstatus: 'EMP', isco08: 'TOTAL' },
    split: SEX,
    expect: 'Average usual weekly hours of work in main job',
    plausible: { min: 25, max: 50 },
  },
  {
    key: 'first-child',
    code: 'demo_find',
    params: { indic_de: 'AGEMOTH1' },
    fixed: { indic_de: 'AGEMOTH1' },
    split: null,
    expect: 'Fertility indicators',
    plausible: { min: 22, max: 35 },
  },
];

/**
 * Bewust niet gebouwd, met de reden erbij zodat niemand het opnieuw hoeft uit te
 * zoeken:
 *
 * - **Trouwleeftijd** (`tps00014`). Splitst via `indic_de` in `MAGEMAR1` en
 *   `FAGEMAR1`, de gemiddelde leeftijd bij het eerste huwelijk van mannen en van
 *   vrouwen. Er is geen gepubliceerd totaal. Dat zelf middelen zou een verzonnen
 *   statistiek zijn, dus de bouwer weigert een metriek zonder totaal.
 *
 * - **Kamers per persoon** (`ilc_lvho04`). Heeft dimensies voor
 *   armoederisico en huishoudsamenstelling; welke doorsnede de juiste is, is een
 *   redactionele keuze die eerst gemaakt moet worden.
 */
export const NOT_BUILT = ['tps00014', 'ilc_lvho04'];

export const metricByKey = (key) => METRICS.find((metric) => metric.key === key);
