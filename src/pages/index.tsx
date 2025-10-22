import Layout from "@/components/Layout";
import CategoryCard from "@/components/CategoryCard";
import categories from "@/data/categories.json";
import BlobBackground from "@/components/BlobBackground";
import HighlightStats from "@/components/HighlightStats";
import { motion } from "framer-motion";

type Cat = { slug: string; title: string; subtitle: string; emoji: string; color: string };

// Demo highlight data — vervang straks met echte waarden uit je JSON
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
      description="Explore trusted averages across money, work, lifestyle, health, tech and habits. Fun, bright, and data-driven."
    >
      <div className="relative">
        <BlobBackground />

        {/* HERO */}
        <section className="mb-10">
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-4xl font-extrabold tracking-tight mb-2"
          >
            Discover how average you really are
          </motion.h1>
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
            className="text-gray-700 dark:text-gray-300 max-w-2xl"
          >
            Browse trusted stats with playful neon accents. Later, take quick tests for a personal comparison.
          </motion.p>
        </section>

        {/* GRID: 1 → 2 → 3 → 4 kolommen */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mb-10">
          {(categories as Cat[]).map((c, idx) => (
            <motion.div
              key={c.slug}
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: idx * 0.04, ease: "easeOut" }}
            >
              <CategoryCard {...c} />
            </motion.div>
          ))}
        </section>

        {/* HIGHLIGHT STATS */}
        <div className="mb-10">
          <HighlightStats stats={demoStats} />
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
    </Layout>
  );
}
