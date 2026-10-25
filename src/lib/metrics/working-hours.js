/**
 * De beschrijving van de metriek "working-hours".
 *
 * Eurostat `lfsa_ewhuis`: de gebruikelijke wekelijkse arbeidsduur in de hoofdbaan,
 * voor werkenden van 20 tot 64, uit de Labour Force Survey.
 *
 * Dit is de enige metriek op de site waar de uitsplitsing naar geslacht géén
 * uitzondering kent: in alle 34 landen werken vrouwen minder betaalde uren dan
 * mannen. Dat is wat deze pagina te zeggen heeft.
 *
 * Gefilterd op `isco08=TOTAL`, `wstatus=EMP`, `worktime=TOTAL`, `age=Y20-64`.
 * Ongefilterd is deze dataset te groot om op te halen.
 *
 * Alles hier is plat: geen functies, zodat de beschrijving door het JSON-blok naar
 * de browser kan en server en client met dezelfde configuratie rekenen.
 */
import { STAGES } from '../hue.js';

const workingHours = {
  key: 'working-hours',
  label: 'Working hours',
  path: '/working-hours/',
  hue: STAGES.hours,
  sourceName: 'Eurostat',

  decimals: 1,
  unit: 'hours',
  unitOne: 'hour',

  /** Stappen van twee uur rond het Europese cijfer van 37,3; uitersten 33,0 en 44,1. */
  bands: [
    { until: 35, label: 'under 35' },
    { until: 37, label: '35 to 37' },
    { until: 39, label: '37 to 39' },
    { until: 41, label: '39 to 41' },
    { until: 43, label: '41 to 43' },
    { until: Infinity, label: '43 and over' },
  ],

  lenses: [
    { key: 'total', label: 'Everyone', who: 'people in work' },
    { key: 'men', label: 'Men', who: 'men in work' },
    { key: 'women', label: 'Women', who: 'women in work' },
  ],

  words: {
    low: 'Shortest',
    high: 'Longest',
    comparative: 'shortest',
    above: 'longer',
    below: 'shorter',
    mapSubject: 'how many hours a week {who} usually work in their main job',
    euNote: "Eurostat's figure for the European Union.",
  },

  input: {
    label: 'Hours you usually work',
    min: 1,
    max: 80,
    step: 0.5,
    placeholder: '36',
    noun: 'a number of hours',
  },
};

export default workingHours;
