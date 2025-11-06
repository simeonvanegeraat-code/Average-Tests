// lib/quizData/digital-detox.ts

export type DetoxQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string; weight: number }[];
};

export type DigitalDetoxQuizData = {
  slug: "digital-detox";
  title: string;
  description: string;
  image?: string;
  questions: DetoxQuestion[];
  interpret(percent: number): { label: string; summary: string };
};

export const digitalDetoxQuiz: DigitalDetoxQuizData = {
  slug: "digital-detox",
  title: "Digital Detox Test — How Addicted Are You to Your Phone?",
  description:
    "Discover your digital balance — measure how often, why, and when you reach for your phone.",
  image: "/images/quizzes/digital-detox-card.png", // gebruik .png als je nog geen .webp hebt
  questions: [
    {
      id: "q1",
      prompt: "How often do you check your phone within 10 minutes of waking up?",
      options: [
        { id: "a", label: "Every single morning", weight: 1 },
        { id: "b", label: "Most mornings", weight: 2 },
        { id: "c", label: "Occasionally", weight: 3 },
        { id: "d", label: "Rarely or never", weight: 4 },
      ],
    },
    {
      id: "q2",
      prompt: "During meals, how often do you use your phone?",
      options: [
        { id: "a", label: "Constantly scrolling or replying", weight: 1 },
        { id: "b", label: "I glance at notifications", weight: 2 },
        { id: "c", label: "Only if something urgent", weight: 3 },
        { id: "d", label: "Never, I keep it away", weight: 4 },
      ],
    },
    {
      id: "q3",
      prompt: "How often do you unlock your phone without a clear reason?",
      options: [
        { id: "a", label: "Many times an hour", weight: 1 },
        { id: "b", label: "A few times per hour", weight: 2 },
        { id: "c", label: "A few times per day", weight: 3 },
        { id: "d", label: "Rarely", weight: 4 },
      ],
    },
    {
      id: "q4",
      prompt: "When you hear a notification sound, what’s your first reaction?",
      options: [
        { id: "a", label: "Immediate urge to check", weight: 1 },
        { id: "b", label: "I check soon after", weight: 2 },
        { id: "c", label: "I notice but wait until convenient", weight: 3 },
        { id: "d", label: "I usually ignore it", weight: 4 },
      ],
    },
    {
      id: "q5",
      prompt: "How often do you feel anxious or restless without your phone nearby?",
      options: [
        { id: "a", label: "Almost always", weight: 1 },
        { id: "b", label: "Often", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Rarely", weight: 4 },
      ],
    },
    {
      id: "q6",
      prompt: "How much time do you estimate you spend on your phone daily?",
      options: [
        { id: "a", label: "6+ hours", weight: 1 },
        { id: "b", label: "4–6 hours", weight: 2 },
        { id: "c", label: "2–4 hours", weight: 3 },
        { id: "d", label: "Less than 2 hours", weight: 4 },
      ],
    },
    {
      id: "q7",
      prompt: "Do you use your phone right before sleep?",
      options: [
        { id: "a", label: "Every night", weight: 1 },
        { id: "b", label: "Most nights", weight: 2 },
        { id: "c", label: "Occasionally", weight: 3 },
        { id: "d", label: "Rarely or never", weight: 4 },
      ],
    },
    {
      id: "q8",
      prompt: "How often do you get distracted by your phone while working or studying?",
      options: [
        { id: "a", label: "Constantly", weight: 1 },
        { id: "b", label: "Frequently", weight: 2 },
        { id: "c", label: "Occasionally", weight: 3 },
        { id: "d", label: "Rarely", weight: 4 },
      ],
    },
    {
      id: "q9",
      prompt: "How often do you check your phone during social interactions?",
      options: [
        { id: "a", label: "Even mid-conversation", weight: 1 },
        { id: "b", label: "Sometimes, discreetly", weight: 2 },
        { id: "c", label: "Only when necessary", weight: 3 },
        { id: "d", label: "I keep it out of sight", weight: 4 },
      ],
    },
    {
      id: "q10",
      prompt: "How often do you feel you’ve lost track of time while on your phone?",
      options: [
        { id: "a", label: "Daily", weight: 1 },
        { id: "b", label: "A few times a week", weight: 2 },
        { id: "c", label: "Occasionally", weight: 3 },
        { id: "d", label: "Rarely", weight: 4 },
      ],
    },
    {
      id: "q11",
      prompt: "Do you use 'Do Not Disturb' or screen-time features?",
      options: [
        { id: "a", label: "Never", weight: 1 },
        { id: "b", label: "Tried but stopped", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Regularly", weight: 4 },
      ],
    },
    {
      id: "q12",
      prompt:
        "How often do you take intentional breaks from your phone (e.g., no-phone hours or weekends)?",
      options: [
        { id: "a", label: "Never", weight: 1 },
        { id: "b", label: "Rarely", weight: 2 },
        { id: "c", label: "Occasionally", weight: 3 },
        { id: "d", label: "Often", weight: 4 },
      ],
    },
  ],
  interpret(percent: number) {
    if (percent >= 80) {
      return {
        label: "Digitally Balanced",
        summary:
          "You use technology consciously — your phone serves you, not the other way around. Keep protecting your focus windows.",
      };
    }
    if (percent >= 60) {
      return {
        label: "Mildly Connected",
        summary:
          "You’re mostly balanced, but some habits occasionally pull you in. Small tweaks (e.g., fewer notifications) could unlock even more focus.",
      };
    }
    if (percent >= 40) {
      return {
        label: "Highly Connected",
        summary:
          "Your phone use is above average. Try reclaiming blocks of time for deep work and rest to reduce digital fatigue.",
      };
    }
    return {
      label: "Digitally Dependent",
      summary:
        "Your phone may be shaping your day more than you realize. A few boundaries (no-phone meals, DND at night) can help you regain time and attention.",
    };
  },
};

export const DIGITAL_DETOX_MAX_SCORE = 12 * 4; // 48
