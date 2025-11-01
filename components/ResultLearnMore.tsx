// components/ResultLearnMore.tsx

type SourceLink = { href: string; label: string };

export default function ResultLearnMore({
  title = "Learn More About Healthy Sleep",
  intro = "Good sleep isn’t just about hours — it’s about rhythm, light exposure, and consistency. Studies suggest that aligning your sleep window and limiting screens before bed can meaningfully improve deep sleep and daytime energy.",
  tips = [
    "Keep a consistent bedtime and wake-up time — even on weekends.",
    "Limit caffeine after 3 PM and large meals 2–3 hours before bed.",
    "Keep your room dark, cool, and quiet (blackout curtains, 17–19°C).",
    "Avoid phones and laptops in the last hour before sleep.",
    "Get daylight exposure in the morning to anchor your rhythm.",
  ],
  sources = [
    { href: "https://www.sleepfoundation.org/how-sleep-works", label: "Sleep Foundation — How Sleep Works" },
    { href: "https://www.health.harvard.edu/newsletter_article/the-importance-of-sleep-and-its-impact-on-health", label: "Harvard Health — The Importance of Sleep" },
    { href: "https://www.cdc.gov/sleep/about_sleep/sleep_hygiene.html", label: "CDC — Sleep Hygiene" },
    { href: "https://www.who.int/teams/health-promotion/physical-activity", label: "WHO — Activity & Recovery Guidelines" },
  ] as SourceLink[],
  disclaimer = "This section is educational and not a medical assessment. If sleep issues persist, consider professional advice.",
}: {
  title?: string;
  intro?: string;
  tips?: string[];
  sources?: SourceLink[];
  disclaimer?: string;
}) {
  return (
    <section aria-labelledby="learn-more" className="mt-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 id="learn-more" className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-gray-700 mb-6">{intro}</p>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Practical Tips</h3>
          <ul className="list-disc pl-5 text-gray-800 space-y-1">
            {tips.map((t, i) => (<li key={i}>{t}</li>))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Science-Backed Resources</h3>
          <ul className="space-y-1">
            {sources.map((s, i) => (
              <li key={i}>
                <a className="text-blue-700 underline hover:no-underline" href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-gray-500 text-sm">{disclaimer}</p>
    </section>
  );
}
