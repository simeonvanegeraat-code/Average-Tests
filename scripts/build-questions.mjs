/**
 * Bouwt de vragenset voor het dagelijkse spel.
 *
 *   node scripts/build-questions.mjs   # -> data/questions.json
 *
 * De regel: een vraag wordt *afgeleid* uit gevalideerde data, niet met de hand
 * ingetypt. Voor percentielen hadden we microdata nodig; voor een quizantwoord is
 * één waar cijfer genoeg, maar het moet wel ergens vandaan komen. Alles hier komt
 * uit data/percentiles/*.json, dat op zijn beurt door validate-percentiles.mjs
 * tegen de NCHS-publicatie is gehouden.
 *
 * Komt er later een vraag uit een andere bron, dan hoort daar een regel bij in
 * data/sources.md en een `source`-veld op de vraag. Geen vraag zonder herkomst.
 */
import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../data/questions.json', import.meta.url);

const height = JSON.parse(await readFile(new URL('../data/percentiles/height.json', import.meta.url)));
const weight = JSON.parse(await readFile(new URL('../data/percentiles/weight.json', import.meta.url)));

const SOURCE = {
  id: 'nhanes-2017-2023',
  label: 'CDC/NCHS National Health and Nutrition Examination Survey, 2017–March 2020 and August 2021–August 2023',
  url: 'https://wwwn.cdc.gov/nchs/nhanes/',
};

const inches = (cm) => cm / 2.54;
const pounds = (kg) => kg * 2.2046226218;
const feetInches = (cm) => {
  const total = Math.round(inches(cm));
  return `${Math.floor(total / 12)}'${total % 12}"`;
};

const questions = [];
let nextId = 1;

/**
 * @param unit  'percent' geeft een schuifregelaar van 0 tot 100; 'value' een
 *              regelaar tussen min en max, voor lengtes en gewichten.
 */
function add({ prompt, answer, unit, min, max, step = 1, hint, note }) {
  questions.push({
    id: nextId++,
    prompt,
    answer: Number(answer.toFixed(unit === 'percent' ? 1 : 0)),
    unit,
    range: { min, max, step },
    hint,
    note,
    source: SOURCE.id,
  });
}

/* --- aandeel boven een drempel ------------------------------------------- */
const MIN_RESPONDENTS = 30;

for (const [sexKey, sexWord] of [['male', 'men'], ['female', 'women']]) {
  for (const t of height.aggregates.thresholds[sexKey]) {
    const inch = Math.round(inches(t.value));
    // Alleen drempels waar de steekproef het draagt en waar het antwoord niet
    // triviaal is: onder 2% en boven 98% valt er niets te raden.
    if (t.respondents < MIN_RESPONDENTS || t.share < 2 || t.share > 98) continue;
    if (inch % 2 !== 0) continue; // hele-inch-sprongen zijn genoeg variatie

    add({
      prompt: `What percentage of American ${sexWord} are ${feetInches(t.value)} or taller?`,
      answer: t.share,
      unit: 'percent',
      min: 0, max: 100, step: 0.5,
      hint: 'Adults aged 20 to 79',
      note: `${(t.population / 1e6).toFixed(1)} million ${sexWord}.`,
    });
  }
}

for (const [sexKey, sexWord] of [['male', 'men'], ['female', 'women']]) {
  for (const t of weight.aggregates.thresholds[sexKey]) {
    const lb = Math.round(pounds(t.value));
    if (t.respondents < MIN_RESPONDENTS || t.share < 2 || t.share > 98) continue;
    if (lb % 40 !== 0) continue;

    add({
      prompt: `What percentage of American ${sexWord} weigh ${lb} lb or more?`,
      answer: t.share,
      unit: 'percent',
      min: 0, max: 100, step: 0.5,
      hint: 'Adults aged 20 to 79',
      note: `${(t.population / 1e6).toFixed(1)} million ${sexWord}.`,
    });
  }
}

/* --- medianen per leeftijdsgroep ----------------------------------------- */
for (const band of height.aggregates.bands) {
  for (const [sexKey, sexWord] of [['male', 'men'], ['female', 'women']]) {
    add({
      prompt: `What is the median height of American ${sexWord} aged ${band.label.replace('-', ' to ')}?`,
      answer: inches(band[sexKey].p50),
      unit: 'inches',
      min: 58, max: 76, step: 0.5,
      hint: 'Measured, not self-reported',
      note: `${band[sexKey].p50} cm — ${feetInches(band[sexKey].p50)}.`,
    });
  }
}

for (const band of weight.aggregates.bands) {
  for (const [sexKey, sexWord] of [['male', 'men'], ['female', 'women']]) {
    add({
      prompt: `What is the median weight of American ${sexWord} aged ${band.label.replace('-', ' to ')}?`,
      answer: pounds(band[sexKey].p50),
      unit: 'pounds',
      min: 100, max: 280, step: 1,
      hint: 'Measured, not self-reported',
      note: `${band[sexKey].p50} kg.`,
    });
  }
}

const doc = {
  generated: new Date().toISOString().slice(0, 10),
  sources: { [SOURCE.id]: SOURCE },
  questions,
};

await writeFile(OUT, JSON.stringify(doc, null, 1) + '\n');

const byUnit = questions.reduce((acc, q) => ({ ...acc, [q.unit]: (acc[q.unit] ?? 0) + 1 }), {});
console.log(`${questions.length} vragen -> data/questions.json`);
console.log('  per type:', Object.entries(byUnit).map(([u, n]) => `${u}=${n}`).join(', '));
console.log(`  genoeg voor ${Math.floor(questions.length / 5)} dagen bij 5 vragen per dag`);
