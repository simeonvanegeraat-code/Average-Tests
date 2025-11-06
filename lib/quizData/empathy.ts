// lib/quizData/empathy.ts

export type EmpathyQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string; weight: number }[];
};

export type EmpathyQuizData = {
  slug: "empathy";
  title: string;
  description: string;
  image?: string;
  questions: EmpathyQuestion[];
  interpret(percent: number): { label: string; summary: string };
};

export const empathyQuiz: EmpathyQuizData = {
  slug: "empathy",
  title: "Empathy Test — How Well Do You Understand Others?",
  description:
    "Gauge everyday behaviors linked to perspective-taking, listening, and emotional awareness. Not a clinical assessment.",
  image: "/images/quizzes/empathy-card.png",
  questions: [
    {
      id: "q1",
      prompt: "When someone shares a problem, what’s your typical first move?",
      options: [
        { id: "a", label: "Offer a fix before they finish", weight: 1 },
        { id: "b", label: "Suggest ideas quickly", weight: 2 },
        { id: "c", label: "Ask clarifying questions", weight: 3 },
        { id: "d", label: "Reflect feelings first, then discuss options", weight: 4 },
      ],
    },
    {
      id: "q2",
      prompt: "In group chats or meetings, how often do you summarize others’ points before replying?",
      options: [
        { id: "a", label: "Almost never", weight: 1 },
        { id: "b", label: "Rarely", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Often/consistently", weight: 4 },
      ],
    },
    {
      id: "q3",
      prompt: "When someone disagrees with you, how do you respond?",
      options: [
        { id: "a", label: "Defend hard right away", weight: 1 },
        { id: "b", label: "Explain my view again", weight: 2 },
        { id: "c", label: "Ask what matters to them", weight: 3 },
        { id: "d", label: "Restate their view fairly, then add mine", weight: 4 },
      ],
    },
    {
      id: "q4",
      prompt: "How often do you pick up on subtle mood changes in people you know well?",
      options: [
        { id: "a", label: "Rarely", weight: 1 },
        { id: "b", label: "Sometimes", weight: 2 },
        { id: "c", label: "Often", weight: 3 },
        { id: "d", label: "Very often", weight: 4 },
      ],
    },
    {
      id: "q5",
      prompt: "When a friend cancels last minute, what’s your default interpretation?",
      options: [
        { id: "a", label: "They don’t care", weight: 1 },
        { id: "b", label: "They’re careless", weight: 2 },
        { id: "c", label: "Maybe overwhelmed", weight: 3 },
        { id: "d", label: "Assume good intent, ask if they’re okay", weight: 4 },
      ],
    },
    {
      id: "q6",
      prompt: "How present are you in 1-to-1 conversations (minimize phone, distractions)?",
      options: [
        { id: "a", label: "Not very", weight: 1 },
        { id: "b", label: "I try but slip often", weight: 2 },
        { id: "c", label: "Mostly present", weight: 3 },
        { id: "d", label: "Fully present (phone away, eye contact)", weight: 4 },
      ],
    },
    {
      id: "q7",
      prompt: "Do you check back later with someone who shared something difficult?",
      options: [
        { id: "a", label: "Never", weight: 1 },
        { id: "b", label: "Rarely", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Often/always follow up", weight: 4 },
      ],
    },
    {
      id: "q8",
      prompt: "When you’ve upset someone, what do you do first?",
      options: [
        { id: "a", label: "Explain my intentions", weight: 1 },
        { id: "b", label: "Say 'sorry' quickly and move on", weight: 2 },
        { id: "c", label: "Ask what hurt and listen fully", weight: 3 },
        { id: "d", label: "Acknowledge impact, then repair specifically", weight: 4 },
      ],
    },
    {
      id: "q9",
      prompt: "How comfortable are you sitting with someone’s feelings without ‘fixing’?",
      options: [
        { id: "a", label: "Very uncomfortable", weight: 1 },
        { id: "b", label: "Slightly uncomfortable", weight: 2 },
        { id: "c", label: "Fairly okay", weight: 3 },
        { id: "d", label: "Very comfortable", weight: 4 },
      ],
    },
    {
      id: "q10",
      prompt: "How often do you adapt your communication to the other person’s style?",
      options: [
        { id: "a", label: "Almost never", weight: 1 },
        { id: "b", label: "Sometimes", weight: 2 },
        { id: "c", label: "Often", weight: 3 },
        { id: "d", label: "Consistently (tone, pace, detail)", weight: 4 },
      ],
    },
    {
      id: "q11",
      prompt: "When you disagree, how often do you look for common ground first?",
      options: [
        { id: "a", label: "Never", weight: 1 },
        { id: "b", label: "Rarely", weight: 2 },
        { id: "c", label: "Sometimes", weight: 3 },
        { id: "d", label: "Often/always", weight: 4 },
      ],
    },
    {
      id: "q12",
      prompt: "Overall, how would you describe your listening quality?",
      options: [
        { id: "a", label: "I miss a lot", weight: 1 },
        { id: "b", label: "Average", weight: 2 },
        { id: "c", label: "Good", weight: 3 },
        { id: "d", label: "Deep/reflective", weight: 4 },
      ],
    },
  ],
  interpret(percent: number) {
    if (percent >= 80) {
      return {
        label: "Highly Empathic",
        summary:
          "You listen deeply, reflect feelings accurately, and repair well. People likely feel understood around you.",
      };
    }
    if (percent >= 60) {
      return {
        label: "Empathic with Room to Grow",
        summary:
          "Strong habits overall. Focusing on presence (phone away) and following up later can strengthen relationships further.",
      };
    }
    if (percent >= 40) {
      return {
        label: "Developing Empathy",
        summary:
          "You’re building key skills. Try reflecting feelings before offering fixes, and adapt your style to the other person.",
      };
    }
    return {
      label: "Early-Stage Listener",
      summary:
        "Start with small shifts: summarize what you heard, ask what matters most, and be comfortable with silence.",
    };
  },
};

export const EMPATHY_MAX_SCORE = 12 * 4;
