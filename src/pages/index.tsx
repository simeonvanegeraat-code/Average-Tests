// src/pages/index.tsx
import Layout from "@/components/Layout";
import CategoryCard from "@/components/CategoryCard";
import categories from "@/data/categories.json";
import BlobBackground from "@/components/BlobBackground";

type Cat = { slug: string; title: string; subtitle: string; emoji: string; color: string };

// Demo highlight data — vervang straks met echte waarden uit je JSON
const demoStats = [
  { id: "s1", emoji: "💰", label: "Avg monthly savings (EU, 25–34)", value: "€ 250", sub: "Median: € 230" },
  { id: "s2", emoji: "⏱️", label: "Daily screen time (global)", value: "3.2 h", sub: "Median: 2.9 h" },
  { id: "s3", emoji: "😴", label: "Sleep per night", value: "7.1 h", sub: "Median: 7.0 h" },
  { id: "s4", emoji: "📚", label: "Books per year", value: "6", sub: "Median: 4" }
];

import HighlightStats from "@/components/HighlightStats";

export default function Home() {
  return (
    <Layout
      title="Human Average"
      description="Explore trusted averages across money, work, lifestyle, health, tech and habits. Fun, bright, and data-driven."
    >
      <div className="relative">
        <BlobBackground />

        {/* HERO */}
        <section className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2
                         opacity-0 translate-y-3 animate-[fadeUp_.5s_ease-out_.05s_forwards]">
            Discover how average you really are
          </h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl
                        opacity-0 translate-y-3 animate-[fadeUp_.5s_ease-out_.1s_forwards]">
            Browse trusted stats with playful neon accents. Later, take quick tests for a personal comparison.
          </p>
        </section>

        {/* GRID: 1 → 2 → 3 → 4 kolommen */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mb-10">
          {(categories as Cat[]).map((c) => (
            <div
              key={c.slug}
              className="opacity-0 translate-y-2 animate-[fadeUp_.45s_ease-out_forwards]"
            >
              <CategoryCard {...c} />
            </div>
          ))}
        </section>

        {/* HIGHLIGHT STATS */}
        <div className="mb-10">
          <HighlightStats stats={demoStats as any} />
        </div>

        {/* INTRO BLOK */}
        <section className="card bg-gradient-to-br from-emerald-400/15 via-cyan-400/10 to-sky-400/15 border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-2">What is Human Average?</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Human Average is a bright, modern data hub. We collect and present typical values for money, health, work, tech and more.
            See mean and median so you get a fair picture. Sources are official and transparent.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="/category/money" className="btn btn-primary">Explore topics</a>
            <a href="/test/global-monthly-savings-plus-wealth" className="btn border border-gray-300 dark:border-gray-700">
              Try the savings test
            </a>
          </div>
        </section>
      </div>

      {/* Kleine keyframes voor fadeUp */}
      <style jsx global>{`
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
