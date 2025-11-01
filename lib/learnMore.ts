// lib/learnMore.ts
export type LearnMoreContent = {
  title: string;
  intro: string;
  tips: string[];
  sources: { href: string; label: string }[];
  disclaimer?: string;
};

const REGISTRY: Record<string, LearnMoreContent> = {
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

  // Next quizzes later:
  // "screen-time": { ... },
  // "focus-habits": { ... },
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
