// lib/quizData/sleep-habits.ts

export type SleepQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string; weight: number }[];
};

export type SleepQuizData = {
  slug: "sleep-habits";
  title: string;
  description: string;
  image?: string;
  questions: SleepQuestion[];
  interpret(percent: number): { label: string; summary: string };
};

// 12 behavior-based, realistic questions about rhythm, recovery & environment
export const sleepHabitsQuiz: SleepQuizData = {
  slug: "sleep-habits",
  title: "Sleep Habits: Do You Rest Better Than Most?",
  description:
    "Measure the quality of your sleep habits across rhythm, environment, and recovery.",
  image: "/og-default.png",
  questions: [
    {
      id: "q1",
      prompt: "On average, how many hours do you sleep per night?",
      options: [
        { id: "a", label: "Less than 5 hours", weight: 1 },
        { id: "b", label: "5–6 hours", weight: 2 },
        { id: "c", label: "7–8 hours", weight: 4 },
        { id: "d", label: "9 hours or more", weight: 3 },
      ],
    },
    {
      id: "q2",
      prompt: "How long does it usually take you to fall asleep?",
      options: [
        { id: "a", label: "More than 45 minutes", weight: 1 },
        { id: "b", label: "30–45 minutes", weight: 2 },
        { id: "c", label: "15–30 minutes", weight: 3 },
        { id: "d", label: "Under 15 minutes", weight: 4 },
      ],
    },
    {
      id: "q3",
      prompt: "How often do you wake up during the night?",
      options: [
        { id: "a", label: "Several times every night", weight: 1 },
        { id: "b", label: "Once per night", weight: 2 },
        { id: "c", label: "Rarely", weight: 3 },
        { id: "d", label: "Never", weight: 4 },
      ],
    },
    {
      id: "q4",
      prompt: "Do you use screens (phone, laptop, TV) within 60 minutes before bedtime?",
      options: [
        { id: "a", label: "Every night", weight: 1 },
        { id: "b", label: "Most nights", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Rarely or never", weight: 4 },
      ],
    },
    {
      id: "q5",
      prompt: "How consistent is your sleep schedule (bedtime and wake-up time)?",
      options: [
        { id: "a", label: "Very irregular", weight: 1 },
        { id: "b", label: "Somewhat irregular", weight: 2 },
        { id: "c", label: "Mostly consistent", weight: 3 },
        { id: "d", label: "Fully consistent", weight: 4 },
      ],
    },
    {
      id: "q6",
      prompt: "How do you usually feel upon waking up?",
      options: [
        { id: "a", label: "Still tired or groggy", weight: 1 },
        { id: "b", label: "Neutral — depends on the day", weight: 2 },
        { id: "c", label: "Fairly refreshed", weight: 3 },
        { id: "d", label: "Fully rested and alert", weight: 4 },
      ],
    },
    {
      id: "q7",
      prompt: "How often do you consume caffeine after 3 PM?",
      options: [
        { id: "a", label: "Daily", weight: 1 },
        { id: "b", label: "A few times per week", weight: 2 },
        { id: "c", label: "Rarely", weight: 3 },
        { id: "d", label: "Never", weight: 4 },
      ],
    },
    {
      id: "q8",
      prompt: "How often do you nap during the day?",
      options: [
        {
          id: "a",
          label: "Every day — it’s part of my routine",
          weight: 2, // structureel nap-ritme; kan gezond zijn, maar wijst op extra rustbehoefte
        },
        {
          id: "b",
          label: "2–5 times per week, depending on how tired I feel",
          weight: 3, // regelmatig herstelmoment
        },
        {
          id: "c",
          label: "1–2 times per week, usually on weekends or after short nights",
          weight: 4, // incidenteel herstel; gezonde balans
        },
        {
          id: "d",
          label: "Never — I generally stay energized without naps",
          weight: 4, // stabiel energieniveau
        },
      ],
    },
    {
      id: "q9",
      prompt: "How often do you go to bed with active thoughts about work or stress?",
      options: [
        { id: "a", label: "Every night", weight: 1 },
        { id: "b", label: "Most nights", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Rarely or never", weight: 4 },
      ],
    },
    {
      id: "q10",
      prompt: "How would you rate your sleep environment (dark, quiet, cool)?",
      options: [
        { id: "a", label: "Poor", weight: 1 },
        { id: "b", label: "Average", weight: 2 },
        { id: "c", label: "Good", weight: 3 },
        { id: "d", label: "Excellent", weight: 4 },
      ],
    },
    {
      id: "q11",
      prompt: "How often do you eat heavy meals or drink alcohol within 2–3 hours before bed?",
      options: [
        { id: "a", label: "Several times per week", weight: 1 },
        { id: "b", label: "Once per week", weight: 2 },
        { id: "c", label: "A few times per month", weight: 3 },
        { id: "d", label: "Rarely or never", weight: 4 },
      ],
    },
    {
      id: "q12",
      prompt: "Overall, how would you rate your current sleep habits?",
      options: [
        { id: "a", label: "Poor", weight: 1 },
        { id: "b", label: "Average", weight: 2 },
        { id: "c", label: "Good", weight: 3 },
        { id: "d", label: "Excellent", weight: 4 },
      ],
    },
  ],
  interpret(percent: number) {
    if (percent >= 80) {
      return {
        label: "You sleep better than most people.",
        summary:
          "Your habits suggest strong recovery and consistent rest. Keep protecting your routine — it likely fuels your daytime energy.",
      };
    }
    if (percent >= 60) {
      return {
        label: "You rest well with room for fine-tuning.",
        summary:
          "Small tweaks (like tighter screen cut-off times or a steadier schedule) could lift your sleep from good to great.",
      };
    }
    if (percent >= 40) {
      return {
        label: "You’re around the human average.",
        summary:
          "Some habits may be holding you back. Try dialing in your rhythm, light exposure, and pre-bed routine for better recovery.",
      };
    }
    return {
      label: "You rest worse than most.",
      summary:
        "Your routine likely needs a reset. A calmer pre-bed hour, a darker room, and less late caffeine can noticeably improve rest.",
    };
  },
};

export const SLEEP_MAX_SCORE = 12 * 4; // 48
