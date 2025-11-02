// lib/quizData/introvert-extrovert.ts

export type IEQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string; weight: number }[]; // weight 1=introvert, 4=extravert
};

export const INTRO_EXTRO_MAX_SCORE = 12 * 4; // 48

export const introExtroQuiz = {
  slug: "introvert-extrovert",
  title: "Introvert or Extravert: Where Do You Thrive?",
  description:
    "A quick, behavior-based check on how you recharge, connect, and work best — no labels, no judgment.",
  image: "/images/quizzes/introvert-extrovert-card.png", // put the file in /public/images/quizzes/
  questions: <IEQuestion[]>[
    {
      id: "q1",
      prompt: "After a busy social evening, how do you usually feel the next day?",
      options: [
        { id: "a", label: "Drained — I need quiet time to recover", weight: 1 },
        { id: "b", label: "A bit tired, I’ll take it slow", weight: 2 },
        { id: "c", label: "Pretty normal — depends on the week", weight: 3 },
        { id: "d", label: "Energized — I’d do it again tonight", weight: 4 },
      ],
    },
    {
      id: "q2",
      prompt: "Your ideal weekend looks like…",
      options: [
        { id: "a", label: "Solo time, hobbies, and a quiet night in", weight: 1 },
        { id: "b", label: "One plan with close friends, one day to recharge", weight: 2 },
        { id: "c", label: "A mix — brunch, errands, maybe an event", weight: 3 },
        { id: "d", label: "Multiple plans — parties, groups, new people", weight: 4 },
      ],
    },
    {
      id: "q3",
      prompt: "At work or school, which environment helps you the most?",
      options: [
        { id: "a", label: "Quiet, minimal interruptions", weight: 1 },
        { id: "b", label: "Small team spaces with clear focus time", weight: 2 },
        { id: "c", label: "Open areas with some buzz", weight: 3 },
        { id: "d", label: "Busy, collaborative spaces with lots of people", weight: 4 },
      ],
    },
    {
      id: "q4",
      prompt: "In group discussions or meetings, you tend to…",
      options: [
        { id: "a", label: "Listen, think, speak when I’m ready", weight: 1 },
        { id: "b", label: "Share if asked or when I have a formed point", weight: 2 },
        { id: "c", label: "Jump in a few times, react and build", weight: 3 },
        { id: "d", label: "Lead or speak up early and often", weight: 4 },
      ],
    },
    {
      id: "q5",
      prompt: "When making plans with friends, you prefer…",
      options: [
        { id: "a", label: "1:1 time or a tiny group", weight: 1 },
        { id: "b", label: "A small group I know well", weight: 2 },
        { id: "c", label: "Medium groups or mixed company", weight: 3 },
        { id: "d", label: "Big groups, the more the better", weight: 4 },
      ],
    },
    {
      id: "q6",
      prompt: "How do you usually handle unexpected invitations?",
      options: [
        { id: "a", label: "Usually pass — I like to prepare mentally", weight: 1 },
        { id: "b", label: "Sometimes, if it’s low-key or nearby", weight: 2 },
        { id: "c", label: "Often say yes — sounds fun", weight: 3 },
        { id: "d", label: "Absolutely — spontaneous plans are the best", weight: 4 },
      ],
    },
    {
      id: "q7",
      prompt: "Your communication comfort zone is…",
      options: [
        { id: "a", label: "Text or email — time to think is helpful", weight: 1 },
        { id: "b", label: "Voice notes or short calls with close people", weight: 2 },
        { id: "c", label: "Calls and group chats fairly often", weight: 3 },
        { id: "d", label: "Calls, video, group chats — I love real-time energy", weight: 4 },
      ],
    },
    {
      id: "q8",
      prompt: "At a networking event, you typically…",
      options: [
        { id: "a", label: "Find a quiet corner or one meaningful 1:1", weight: 1 },
        { id: "b", label: "Speak to a few people, then head out", weight: 2 },
        { id: "c", label: "Work the room for a while", weight: 3 },
        { id: "d", label: "Meet many people — I thrive there", weight: 4 },
      ],
    },
    {
      id: "q9",
      prompt: "When your day gets filled with interruptions, you feel…",
      options: [
        { id: "a", label: "Overstimulated — I need to reset alone", weight: 1 },
        { id: "b", label: "Distracted but manageable", weight: 2 },
        { id: "c", label: "Fine — I can switch gears", weight: 3 },
        { id: "d", label: "Energized — interruptions keep me engaged", weight: 4 },
      ],
    },
    {
      id: "q10",
      prompt: "Your conversation sweet-spot is…",
      options: [
        { id: "a", label: "Deep 1:1 topics with someone I trust", weight: 1 },
        { id: "b", label: "Small group chats with familiar people", weight: 2 },
        { id: "c", label: "Mixed — some small talk, some depth", weight: 3 },
        { id: "d", label: "High-energy group banter", weight: 4 },
      ],
    },
    {
      id: "q11",
      prompt: "When trying new experiences, you tend to…",
      options: [
        { id: "a", label: "Research and plan, go with a close friend", weight: 1 },
        { id: "b", label: "Try if it fits my mood and energy", weight: 2 },
        { id: "c", label: "Say yes if friends suggest it", weight: 3 },
        { id: "d", label: "Actively seek new social experiences", weight: 4 },
      ],
    },
    {
      id: "q12",
      prompt: "At the end of a long day, you recharge best by…",
      options: [
        { id: "a", label: "Quiet solo time (reading, gaming, walks)", weight: 1 },
        { id: "b", label: "Short chat with a close person, then alone time", weight: 2 },
        { id: "c", label: "Hanging out with friends or family", weight: 3 },
        { id: "d", label: "Going out — I get energy from people", weight: 4 },
      ],
    },
  ],
  interpret(percent: number) {
    // percent reflects where you sit on the introvert <-> extrovert spectrum (0–100)
    if (percent >= 80) {
      return {
        label: "Strong Extravert",
        summary:
          "You gain energy from people, variety, and live interaction. Guard a bit of quiet time to avoid overstimulation and keep your social energy sharp.",
      };
    }
    if (percent >= 60) {
      return {
        label: "Extravert-Leaning",
        summary:
          "You’re at your best with regular social fuel. A touch of alone time keeps your focus and prevents burnout — a healthy social rhythm suits you.",
      };
    }
    if (percent >= 40) {
      return {
        label: "Ambivert",
        summary:
          "You flex between quiet focus and social buzz depending on context. Keep mixing both: protect deep-work time and schedule energizing people time.",
      };
    }
    return {
      label: "Introvert-Leaning",
      summary:
        "You recharge in calm spaces and meaningful 1:1 moments. Design your days with buffer time and low-noise focus so you can enjoy social time on your terms.",
    };
  },
};
