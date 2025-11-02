// lib/quizzes.ts
import { sleepHabitsQuiz, SLEEP_MAX_SCORE } from "./quizData/sleep-habits";
import { introExtroQuiz, INTRO_EXTRO_MAX_SCORE } from "./quizData/introvert-extrovert";

export type QuizMeta = {
  slug: string;
  title: string;
  description: string;
  image?: string;
  maxScore: number;
};

// ✅ Alle beschikbare quizzes komen hier in
export const QUIZZES: QuizMeta[] = [
  {
    slug: sleepHabitsQuiz.slug,
    title: sleepHabitsQuiz.title,
    description: sleepHabitsQuiz.description,
    image: sleepHabitsQuiz.image || "/og-default.png",
    maxScore: SLEEP_MAX_SCORE,
  },
  {
    slug: introExtroQuiz.slug,
    title: introExtroQuiz.title,
    description: introExtroQuiz.description,
    image: introExtroQuiz.image || "/og-default.png",
    maxScore: INTRO_EXTRO_MAX_SCORE,
  },
];

// ✅ Handige functie voor metadata (homepage, SEO, etc.)
export function getQuizMetaBySlug(slug: string): QuizMeta | null {
  return QUIZZES.find((q) => q.slug === slug) || null;
}

// ✅ Hiermee haal je de volledige quizdata (alle vragen)
export function getQuizDataBySlug(slug: string) {
  switch (slug) {
    case "sleep-habits":
      return sleepHabitsQuiz;
    case "introvert-extrovert":
      return introExtroQuiz;
    default:
      return null;
  }
}
