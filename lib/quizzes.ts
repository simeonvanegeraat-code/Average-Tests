export type QuizQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string; weight: number }[];
};

export type Quiz = {
  slug: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  resultLabels: { low: string; mid: string; high: string };
  image?: string;
};

export const quizzes: Quiz[] = [
  {
    slug: "focus-vs-distraction",
    title: "Focus vs Distraction: Are You Above Average?",
    description: "Test your ability to focus in a world full of distractions.",
    image: "/og-default.png",
    resultLabels: {
      low: "Easily distracted — your mind loves to wander.",
      mid: "Fairly average — focus when needed, but easily derailed.",
      high: "Laser-sharp — you can stay in flow effortlessly."
    },
    questions: [
      {
        id: "1",
        prompt: "How often do you check your phone while working?",
        options: [
          { id: "a", label: "Rarely", weight: 3 },
          { id: "b", label: "Sometimes", weight: 2 },
          { id: "c", label: "Often", weight: 1 }
        ]
      },
      {
        id: "2",
        prompt: "Can you work in noisy environments?",
        options: [
          { id: "a", label: "Yes, easily", weight: 3 },
          { id: "b", label: "Sometimes", weight: 2 },
          { id: "c", label: "Not at all", weight: 1 }
        ]
      }
    ]
  },
  {
    slug: "sleep-habits",
    title: "Sleep Habits: Do You Rest Better Than Most?",
    description: "Find out if your sleep patterns are healthier than average.",
    image: "/og-default.png",
    resultLabels: {
      low: "Restless sleeper — your habits need a reset.",
      mid: "Moderate — decent rest, but not ideal.",
      high: "Excellent sleeper — your body and mind recover well."
    },
    questions: [
      {
        id: "1",
        prompt: "How many hours of sleep do you get per night?",
        options: [
          { id: "a", label: "7–9 hours", weight: 3 },
          { id: "b", label: "5–6 hours", weight: 2 },
          { id: "c", label: "Less than 5 hours", weight: 1 }
        ]
      },
      {
        id: "2",
        prompt: "Do you look at your phone before bed?",
        options: [
          { id: "a", label: "Never", weight: 3 },
          { id: "b", label: "Sometimes", weight: 2 },
          { id: "c", label: "Always", weight: 1 }
        ]
      }
    ]
  },
  {
    slug: "social-energy",
    title: "Social Energy: How Do You Recharge?",
    description: "Measure whether you gain or lose energy from people.",
    image: "/og-default.png",
    resultLabels: {
      low: "Introverted — you need alone time to recharge.",
      mid: "Balanced — a mix of social and solo energy.",
      high: "Extroverted — you thrive around others."
    },
    questions: [
      {
        id: "1",
        prompt: "How do you feel after a big social event?",
        options: [
          { id: "a", label: "Energized", weight: 3 },
          { id: "b", label: "Neutral", weight: 2 },
          { id: "c", label: "Drained", weight: 1 }
        ]
      },
      {
        id: "2",
        prompt: "How much alone time do you need each day?",
        options: [
          { id: "a", label: "Less than an hour", weight: 3 },
          { id: "b", label: "1–3 hours", weight: 2 },
          { id: "c", label: "More than 3 hours", weight: 1 }
        ]
      }
    ]
  }
];

export function getQuiz(slug: string) {
  return quizzes.find((q) => q.slug === slug) || null;
}
