/**
 * De spellogica voor het dagelijkse raadspel.
 *
 * Alles is deterministisch afgeleid uit de datum, dus er is geen server nodig:
 * iedereen krijgt dezelfde vragen op dezelfde dag, en dat is precies wat het
 * delen van een score betekenis geeft.
 */

export const EPOCH = Date.UTC(2026, 7, 30); // 30 augustus 2026 = puzzel #1
export const QUESTIONS_PER_DAY = 5;

/** Hoe ver je ernaast mag zitten voor het antwoord nul punten waard is. */
const TOLERANCE = { percent: 25, inches: 6, pounds: 50 };

export function puzzleNumber(now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - EPOCH) / 86400000) + 1;
}

/** Kleine deterministische generator, zodat dezelfde dag dezelfde volgorde geeft. */
function mulberry32(seed) {
  return function next() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, seed) {
  const random = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * De vragen van vandaag.
 *
 * De set wordt per cyclus geschud en dan op volgorde uitgedeeld, zodat elke vraag
 * één keer voorkomt voordat er iets herhaalt — en de volgorde per cyclus verschilt.
 */
export function questionsForPuzzle(all, number) {
  const perCycle = Math.floor(all.length / QUESTIONS_PER_DAY);
  if (perCycle === 0) return all.slice(0, QUESTIONS_PER_DAY);

  const index = ((number - 1) % perCycle + perCycle) % perCycle;
  const cycle = Math.floor((number - 1) / perCycle);
  const order = shuffle(all, cycle * 7919 + 13);

  return order.slice(index * QUESTIONS_PER_DAY, index * QUESTIONS_PER_DAY + QUESTIONS_PER_DAY);
}

/** 0 tot 1: hoe dicht zat je. Kwadratisch, zodat precisie echt loont. */
export function closeness(question, guess) {
  const tolerance = TOLERANCE[question.unit] ?? 25;
  const error = Math.abs(guess - question.answer);
  return Math.max(0, 1 - error / tolerance);
}

export function scoreFor(question, guess) {
  return Math.round(1000 * closeness(question, guess) ** 2);
}

const TIERS = [
  { at: 0.9, block: '🟩', label: 'spot on' },
  { at: 0.7, block: '🟨', label: 'close' },
  { at: 0.4, block: '🟧', label: 'not quite' },
  { at: 0, block: '⬜', label: 'way off' },
];

export function tierFor(value) {
  return TIERS.find((t) => value >= t.at) ?? TIERS[TIERS.length - 1];
}

export function shareText(number, results, total) {
  const blocks = results.map((r) => tierFor(r.closeness).block).join('');
  return [
    `HumanAverage #${number}`,
    `${blocks}  ${total.toLocaleString('en-US')}/${results.length * 1000}`,
    'humanaverage.com',
  ].join('\n');
}

/* --- reeks en beste score, alleen in de browser van de bezoeker ------------ */

const STORAGE_KEY = 'humanaverage.progress';

export function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') ?? {};
  } catch {
    return {}; // prive-venster, geblokkeerde opslag, of niets opgeslagen
  }
}

export function saveProgress(number, total) {
  try {
    const prev = readProgress();
    const streak = prev.lastPuzzle === number - 1 ? (prev.streak ?? 0) + 1 : 1;
    const next = {
      lastPuzzle: number,
      streak,
      best: Math.max(prev.best ?? 0, total),
      played: (prev.played ?? 0) + 1,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null; // meten mag het spel nooit stukmaken
  }
}

export function alreadyPlayed(number) {
  return readProgress().lastPuzzle === number;
}
