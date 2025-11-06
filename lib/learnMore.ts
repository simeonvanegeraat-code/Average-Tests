// lib/learnMore.ts
export type LearnMoreContent = {
  title: string;
  intro: string;
  tips: string[];
  sources: { href: string; label: string }[];
  disclaimer?: string;
};

const REGISTRY: Record<string, LearnMoreContent> = {
  // ─────────────────────────────────────────────────────────────
  // Sleep Habits
  // ─────────────────────────────────────────────────────────────
  "sleep-habits": {
    title: "Learn More About Healthy Sleep",
    intro:
      "Good sleep isn’t just about hours — it’s about rhythm, light exposure, and consistency. Aligning your sleep window and limiting screens before bed can meaningfully improve deep sleep and daytime energy.",
    tips: [
      "Keep a consistent bedtime and wake-up time — even on weekends.",
      "Limit caffeine after 3 PM and large meals 2–3 hours before bed.",
      "Keep your room dark, cool, and quiet (blackout curtains, 17–19°C).",
      "Avoid phones and laptops in the last hour before sleep.",
      "Get daylight exposure in the morning to anchor your rhythm.",
    ],
    sources: [
      { href: "https://www.sleepfoundation.org/how-sleep-works", label: "Sleep Foundation — How Sleep Works" },
      { href: "https://www.health.harvard.edu/newsletter_article/the-importance-of-sleep-and-its-impact-on-health", label: "Harvard Health — The Importance of Sleep" },
      { href: "https://www.cdc.gov/sleep/about_sleep/sleep_hygiene.html", label: "CDC — Sleep Hygiene" },
      { href: "https://www.who.int/teams/health-promotion/physical-activity", label: "WHO — Activity & Recovery Guidelines" },
    ],
    disclaimer:
      "This section is educational and not a medical assessment. If sleep issues persist, consider professional advice.",
  },

  // ─────────────────────────────────────────────────────────────
  // Introvert vs. Extravert
  // ─────────────────────────────────────────────────────────────
  "introvert-extrovert": {
    title: "Learn More About Extraversion & Introversion",
    intro:
      "Personality isn’t a box — it’s a spectrum. Where you recharge (alone vs. with people) is a strong clue. Many people are ambiverts who flex by context.",
    tips: [
      "Plan your day around how you recharge: quiet deep-work blocks vs. social energy windows.",
      "Protect your strengths: introverts benefit from buffer time; extraverts from regular social contact.",
      "In meetings, decide your move: speak early for airtime, or note 2–3 points and share them clearly.",
      "Design your environment: noise-canceling + focus rituals, or collaborative hubs that energize you.",
      "Choose purpose-based social time: fewer random obligations, more meaningful conversations.",
    ],
    sources: [
      { href: "https://www.apa.org/topics/personality", label: "APA — Personality (American Psychological Association)" },
      { href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6527838/", label: "NIH/PMC — Personality Traits Overview (Big Five)" },
      { href: "https://www.psychologytoday.com/us/basics/introversion", label: "Psychology Today — Introversion (overview)" },
    ],
    disclaimer:
      "Behavior-based content only. Personality is complex and context-dependent; this quiz is not a clinical assessment.",
  },

  // ─────────────────────────────────────────────────────────────
  // Digital Detox
  // ─────────────────────────────────────────────────────────────
  "digital-detox": {
    title: "Learn More About Digital Balance and Screen Habits",
    intro:
      "Phone use can enhance productivity and connection — but constant notifications fragment attention. Research shows that setting intentional boundaries improves mental focus, sleep, and emotional well-being.",
    tips: [
      "Use 'Do Not Disturb' during focus time or meals.",
      "Keep your phone outside the bedroom at night.",
      "Batch or turn off non-essential notifications.",
      "Replace doomscrolling with a 5–10 minute outdoor walk.",
      "Try a daily 'no-screen hour' to reset your attention.",
    ],
    sources: [
      { href: "https://www.health.harvard.edu/mind-and-mood/why-you-cant-stop-checking-your-phone", label: "Harvard Health — Why You Can’t Stop Checking Your Phone" },
      { href: "https://www.apa.org/news/press/releases/2022/05/technology-well-being", label: "APA — Technology and Well-Being" },
      { href: "https://www.who.int/news-room/fact-sheets/detail/digital-health", label: "WHO — Digital Health & Mental Well-being" },
    ],
    disclaimer: "Educational content only; not medical or psychological advice.",
  },

  // ─────────────────────────────────────────────────────────────
  // Sustainability Habits
  // ─────────────────────────────────────────────────────────────
  "sustainability-habits": {
    title: "Learn More About Sustainable Daily Habits",
    intro:
      "Small, consistent choices add up — from commuting and meals to energy and repair. Start with the easiest wins in your routine.",
    tips: [
      "Make one swap this week: bike/foot for short trips, or a plant-based lunch.",
      "Bundle deliveries and choose repairable products.",
      "Use timers/smart plugs to cut standby waste.",
      "Sort recycling + e-waste; donate or resell usable items.",
      "Plan trips: rail/coach where practical, fewer short flights.",
    ],
    sources: [
      { href: "https://www.un.org/en/actnow", label: "UN — ActNow Climate Action" },
      { href: "https://www.iea.org", label: "IEA — Energy Efficiency Resources" },
      { href: "https://www.eea.europa.eu/themes/climate", label: "EEA — Climate & Environment" },
    ],
    disclaimer:
      "Educational content only; local guidance and context may vary.",
  },

  // ─────────────────────────────────────────────────────────────
  // Empathy Test
  // ─────────────────────────────────────────────────────────────
  empathy: {
    title: "Learn More About Everyday Empathy",
    intro:
      "Empathy grows with practice: reflective listening, perspective-taking, and repairing missteps strengthen trust and relationships.",
    tips: [
      "Reflect feelings before fixing problems.",
      "Summarize what you heard to confirm understanding.",
      "Match the other person’s pace and detail level.",
      "Follow up later to show you care.",
      "When wrong, name the impact and repair specifically.",
    ],
    sources: [
      { href: "https://www.apa.org/topics/emotions/empathy", label: "APA — Empathy Overview" },
      { href: "https://greatergood.berkeley.edu/topic/empathy", label: "UC Berkeley — Greater Good: Empathy" },
      { href: "https://www.ncbi.nlm.nih.gov/pmc/", label: "NIH/PMC — Peer-Reviewed Articles (search ‘empathy’)" },
    ],
    disclaimer: "Not a diagnostic tool; for personal reflection and growth.",
  },
};

const FALLBACK: LearnMoreContent = {
  title: "Learn More",
  intro: "Explore practical, evidence-informed tips and resources to improve your daily habits.",
  tips: [
    "Start small and keep changes consistent.",
    "Track one habit for 7–14 days to see real effects.",
    "Reduce friction: prepare your environment in advance.",
    "Reflect weekly on what helped (or didn’t).",
  ],
  sources: [{ href: "https://scholar.google.com/", label: "Google Scholar — Research" }],
  disclaimer: "Educational content only; not a substitute for professional advice.",
};

export function getLearnMoreBySlug(slug: string): LearnMoreContent {
  return REGISTRY[slug] ?? FALLBACK;
}
