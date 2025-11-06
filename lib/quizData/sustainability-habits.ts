// lib/quizData/sustainability-habits.ts

export type SustainQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string; weight: number }[];
};

export type SustainabilityQuizData = {
  slug: "sustainability-habits";
  title: string;
  description: string;
  image?: string;
  questions: SustainQuestion[];
  interpret(percent: number): { label: string; summary: string };
};

export const sustainabilityQuiz: SustainabilityQuizData = {
  slug: "sustainability-habits",
  title: "Sustainability Habits — How Green Are You Compared to Others?",
  description:
    "Measure your day-to-day choices across transport, food, energy, waste, and shopping to see how your habits compare.",
  image: "/images/quizzes/sustainability-habits-card.png", // of .webp als je wilt
  questions: [
    {
      id: "q1",
      prompt: "How do you most often commute or get around locally?",
      options: [
        { id: "a", label: "Solo car most days", weight: 1 },
        { id: "b", label: "Carpool or mixed with transit", weight: 2 },
        { id: "c", label: "Public transit or e-scooter most days", weight: 3 },
        { id: "d", label: "Walk or bike most days", weight: 4 },
      ],
    },
    {
      id: "q2",
      prompt: "How often do you choose plant-based meals?",
      options: [
        { id: "a", label: "Rarely", weight: 1 },
        { id: "b", label: "1–2 times per week", weight: 2 },
        { id: "c", label: "3–5 times per week", weight: 3 },
        { id: "d", label: "Daily or almost daily", weight: 4 },
      ],
    },
    {
      id: "q3",
      prompt: "At home, how mindful are you about heating/cooling efficiency?",
      options: [
        { id: "a", label: "I don’t adjust it much", weight: 1 },
        { id: "b", label: "I lower/raise slightly by season", weight: 2 },
        { id: "c", label: "Timers/zones and insulation attention", weight: 3 },
        { id: "d", label: "Very optimized (heat pump, seals, habits)", weight: 4 },
      ],
    },
    {
      id: "q4",
      prompt: "How do you handle electronics and appliances when not in use?",
      options: [
        { id: "a", label: "Leave on/standby often", weight: 1 },
        { id: "b", label: "Sometimes off", weight: 2 },
        { id: "c", label: "Usually off or on power strip", weight: 3 },
        { id: "d", label: "Always off and managed on timers/smart plugs", weight: 4 },
      ],
    },
    {
      id: "q5",
      prompt: "What best describes your approach to buying new products?",
      options: [
        { id: "a", label: "Lowest price, fast delivery", weight: 1 },
        { id: "b", label: "Price + some durability", weight: 2 },
        { id: "c", label: "Durable, repairable, reviews matter", weight: 3 },
        { id: "d", label: "Repair/reuse first; buy quality when needed", weight: 4 },
      ],
    },
    {
      id: "q6",
      prompt: "How often do you sort and recycle waste correctly?",
      options: [
        { id: "a", label: "Rarely", weight: 1 },
        { id: "b", label: "Sometimes", weight: 2 },
        { id: "c", label: "Most of the time", weight: 3 },
        { id: "d", label: "Always (incl. e-waste, textiles, compost)", weight: 4 },
      ],
    },
    {
      id: "q7",
      prompt: "How frequently do you buy second-hand or refurbished items?",
      options: [
        { id: "a", label: "Never", weight: 1 },
        { id: "b", label: "Rarely", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Often", weight: 4 },
      ],
    },
    {
      id: "q8",
      prompt: "How often do you bring a reusable bottle, mug, or bag?",
      options: [
        { id: "a", label: "Never", weight: 1 },
        { id: "b", label: "Occasionally", weight: 2 },
        { id: "c", label: "Most days", weight: 3 },
        { id: "d", label: "Always", weight: 4 },
      ],
    },
    {
      id: "q9",
      prompt: "For long-distance travel, what’s most typical?",
      options: [
        { id: "a", label: "Frequent short flights", weight: 1 },
        { id: "b", label: "Some flights per year", weight: 2 },
        { id: "c", label: "Train/coach where practical", weight: 3 },
        { id: "d", label: "Few flights; prefer rail/coach when possible", weight: 4 },
      ],
    },
    {
      id: "q10",
      prompt: "How intentional are you about water use (showers, laundry, garden)?",
      options: [
        { id: "a", label: "Not really", weight: 1 },
        { id: "b", label: "A little", weight: 2 },
        { id: "c", label: "Quite mindful", weight: 3 },
        { id: "d", label: "Very mindful (short showers, full loads, timing)", weight: 4 },
      ],
    },
    {
      id: "q11",
      prompt: "Do you check labels for eco-certifications or materials?",
      options: [
        { id: "a", label: "Never", weight: 1 },
        { id: "b", label: "Rarely", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Often/always", weight: 4 },
      ],
    },
    {
      id: "q12",
      prompt: "How often do you repair, repurpose, or donate before discarding?",
      options: [
        { id: "a", label: "Almost never", weight: 1 },
        { id: "b", label: "Rarely", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Frequently", weight: 4 },
      ],
    },
  ],
  interpret(percent: number) {
    if (percent >= 80) {
      return {
        label: "Low-Impact Lifestyle",
        summary:
          "Your daily choices strongly reduce waste and energy use. Keep sharing what works—small actions add up when others follow.",
      };
    }
    if (percent >= 60) {
      return {
        label: "Consistently Green",
        summary:
          "You’re thoughtful about transport, food, and household energy. A few tweaks (repair-first and fewer flights) could raise your impact further.",
      };
    }
    if (percent >= 40) {
      return {
        label: "Moderately Green",
        summary:
          "You’re making progress. Focus on one area—commute, meals, or home energy—to unlock the biggest gains with the least effort.",
      };
    }
    return {
      label: "Getting Started",
      summary:
        "Begin with easy wins: reusable gear, sorting e-waste, and shorter showers. One or two changes done weekly make a real difference over time.",
    };
  },
};

export const SUSTAINABILITY_MAX_SCORE = 12 * 4;
