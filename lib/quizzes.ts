// lib/quizzes.ts
import { sleepHabitsQuiz, SLEEP_MAX_SCORE } from "./quizData/sleep-habits";

export type QuizMeta = {
  slug: string;
  title: string;
  description: string;
  image?: string;
  maxScore: number;
};

export const QUIZZES: QuizMeta[] = [
  {
    slug: sleepHabitsQuiz.slug,
    title: sleepHabitsQuiz.title,
    description: sleepHabitsQuiz.description,
    image: sleepHabitsQuiz.image || "/og-default.png",
    maxScore: SLEEP_MAX_SCORE,
  },
];

export function getQuizMetaBySlug(slug: string): QuizMeta | null {
  return QUIZZES.find((q) => q.slug === slug) || null;
}

export function getQuizDataBySlug(slug: string) {
  switch (slug) {
    case "sleep-habits":
      return sleepHabitsQuiz;
    default:
      return null;
  }
}
