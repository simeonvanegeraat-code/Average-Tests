import Layout from "@/components/Layout";
import CategoryCard from "@/components/CategoryCard";
import categories from "@/data/categories.json";
import BlobBackground from "@/components/BlobBackground";
import HighlightStats from "@/components/HighlightStats";

type Cat = { slug: string; title: string; subtitle: string; emoji: string; color: string };

const demoStats = [
  { id: "s1", emoji: "💰", label: "Avg monthly savings (EU, 25–34)", value: "€ 250", sub: "Median: € 230" },
  { id: "s2", emoji: "⏱️", label: "Daily screen time (global)", value: "3.2 h", sub: "Median: 2.9 h" },
  { id: "s3", emoji: "😴", label: "Sleep per night", value: "7.1 h", sub: "Median: 7.0 h" },
  { id: "s4", emoji: "📚", label: "Books per year", value: "6", sub: "Median: 4" }
];

export default function Home() {
  return (
    <Layout
      title="Human Average"
      description="Minimal, bright and trustworthy. Explore typical values across money, work, lifestyle, health, tech and habits."
    >
      <div className="relative">
        <BlobBackground />

        {/* HERO */}
        <section className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 opacity-0 translate-y-2 animate-fadeUp">
            Discover how average you really are
          </h1>
          <p className="text-gray-700 max-w-2xl opacity-0 translate-y-2 animate-fadeUp"
             style={{ animationDelay: ".08s" }}>
            Clean design, bold accents and real benchmarks. Browse the data, then take short tests for a personal comparison.
          </p>
          <div className="mt-6 flex gap-3 opacity-0 translate-y-2 animate-fadeUp" style={{ animationDelay: ".14s" }}>
            <a href="/category/money" className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-sky-600 text-white hover:bg-sky-700">
              Explore topics
            </a>
            <a href="/test/global-monthly-savings-plus-wealth" className="inline-flex items-center justify-center h-10 px-5 rounded-full border border-gray-300 hover:bg-gray-50">
              Try the savings test
            </a>
          </div>
        </section>

        {/* GRID: 1 → 2 → 3 → 4 kolommen (consistente spacing) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mb-12">
          {(categories as Cat[]).map((c, i) => (
            <div key={c.slug} style={{ opacity: 0, transform: "translateY(8px)", animation: `fadeUp .45s ease-out ${0.03 * i}s forwards` }}>
              <CategoryCard {...c} />
            </div>
          ))}
        </section>

        {/* HIGHLIGHT STATS */}
        <div className="mb-12">
          <HighlightStats stats={demoStats} />
        </div>

        {/* INTRO */}
        <section className="card p-6 bg-gradient-to-br from-teal-50 via-sky-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
          <h2 className="text-2xl font-bold mb-2">What is Human Average?</h2>
          <p className="text-gray-700 dark:text-gray-300">
            A modern data hub about people. We show mean and median so you get a fair picture. Sources are official and transparent.
            The design follows a minimal, Material-inspired system for clarity across desktop and mobile.
          </p>
        </section>
      </div>
    </Layout>
  );
}
