// lib/quizzes.ts
import { sleepHabitsQuiz, SLEEP_MAX_SCORE } from "./quizData/sleep-habits";
import { introExtroQuiz, INTRO_EXTRO_MAX_SCORE } from "./quizData/introvert-extrovert";
import { digitalDetoxQuiz, DIGITAL_DETOX_MAX_SCORE } from "./quizData/digital-detox";
import { sustainabilityQuiz, SUSTAINABILITY_MAX_SCORE } from "./quizData/sustainability-habits";
import { empathyQuiz, EMPATHY_MAX_SCORE } from "./quizData/empathy";

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
  {
    slug: digitalDetoxQuiz.slug,
    title: digitalDetoxQuiz.title,
    description: digitalDetoxQuiz.description,
    image: digitalDetoxQuiz.image || "/og-default.png",
    maxScore: DIGITAL_DETOX_MAX_SCORE,
  },
  {
    slug: sustainabilityQuiz.slug,
    title: sustainabilityQuiz.title,
    description: sustainabilityQuiz.description,
    image: sustainabilityQuiz.image || "/og-default.png",
    maxScore: SUSTAINABILITY_MAX_SCORE,
  },
  {
    slug: empathyQuiz.slug,
    title: empathyQuiz.title,
    description: empathyQuiz.description,
    image: empathyQuiz.image || "/og-default.png",
    maxScore: EMPATHY_MAX_SCORE,
  },
];

// ✅ Voor metadata (homepage, SEO, etc.)
export function getQuizMetaBySlug(slug: string): QuizMeta | null {
  return QUIZZES.find((q) => q.slug === slug) || null;
}

// ✅ Volledige quizdata (alle vragen + interpretatie)
export function getQuizDataBySlug(slug: string) {
  switch (slug) {
    case "sleep-habits":
      return sleepHabitsQuiz;
    case "introvert-extrovert":
      return introExtroQuiz;
    case "digital-detox":
      return digitalDetoxQuiz;
    case "sustainability-habits":
      return sustainabilityQuiz;
    case "empathy":
      return empathyQuiz;
    default:
      return null;
  }
}
