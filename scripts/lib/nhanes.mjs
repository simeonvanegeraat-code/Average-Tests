// Welke NHANES-bestanden we gebruiken, en waarom precies deze.
//
// Twee cycli, samen 2017 t/m augustus 2023. Onderbouwing voor die keuze staat in
// data/sources.md: verder terug poolen (2013-2016) verplaatst de percentielen niet
// meer, maar maakt de data wel tien jaar ouder.
//
// De pre-pandemiecyclus heeft een eigen gewichtsvariabele (WTMECPRP) en beslaat
// ~3,2 jaar in plaats van 2. Bij het combineren schalen we elk gewicht naar het
// aandeel van de totale periode; voor gelijk lange cycli is dat exact de gangbare
// NCHS-regel "deel door het aantal cycli".

export const BASE_URL = 'https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public';

export const CYCLES = [
  {
    id: 'P',
    label: '2017 - maart 2020 (pre-pandemie)',
    years: 3.2,
    weightVar: 'WTMECPRP',
    files: {
      demo: { name: 'P_DEMO.xpt', path: '2017/DataFiles/P_DEMO.xpt', bytes: 3614720,
              sha256: '2e46c6c26bf77cd8989f64011ace12cbf42c0f3e03414eb59acc5328c8f87913' },
      body: { name: 'P_BMX.xpt',  path: '2017/DataFiles/P_BMX.xpt',  bytes: 2520640,
              sha256: '7038d0da3169420a4a3cbaec09ac586a701b38e1c7b925431b60e13ac24fed66' },
    },
  },
  {
    id: 'L',
    label: 'augustus 2021 - augustus 2023',
    years: 2,
    weightVar: 'WTMEC2YR',
    files: {
      demo: { name: 'DEMO_L.xpt', path: '2021/DataFiles/DEMO_L.xpt', bytes: 2582160,
              sha256: 'ca4374a158b493b8b0163e1388da21d57a18d1b9cecff2aa4e2fa2bec494fe23' },
      body: { name: 'BMX_L.xpt',  path: '2021/DataFiles/BMX_L.xpt',  bytes: 1563200,
              sha256: '44440c416d9ad709e8b1708a5975378ab4d5b18edc39eb5015c2ae7186500170' },
    },
  },
];

export const RAW_DIR = new URL('../../data/raw/nhanes/', import.meta.url);

// NHANES top-codeert leeftijd op 80: iedereen van 80 en ouder krijgt RIDAGEYR = 80.
// Die bin is dus geen leeftijdsjaar en mag nooit als leeftijd 80 worden gebruikt.
export const TOP_CODED_AGE = 80;

// We publiceren percentielen voor 20 t/m 79. Leeftijden 18-19 doen wel mee als
// ondersteuning voor de kernel aan de onderrand, maar krijgen geen eigen pagina:
// percentielen voor tieners horen bij groeicurves, niet bij dit product.
export const PUBLISH_AGE_MIN = 20;
export const PUBLISH_AGE_MAX = 79;
export const SUPPORT_AGE_MIN = 18;

export const SEX = { 1: 'male', 2: 'female' };
