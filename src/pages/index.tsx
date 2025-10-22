import Head from "next/head";
import Link from "next/link";

type Cat = {
  slug: string;
  title: string;
  sub: string;
  emoji: string;
};

const CATS: Cat[] = [
  { slug: "money",         title: "Money & Savings",         sub: "Savings, wealth, investing",           emoji: "💰" },
  { slug: "income",        title: "Income & Work",           sub: "Salary by age, hours, side gigs",      emoji: "💼" },
  { slug: "debt",          title: "Debt & Spending",         sub: "Debts, rent, spending habits",         emoji: "🧾" },
  { slug: "lifestyle",     title: "Lifestyle & Relationships", sub: "Status, housing, friends, kids",     emoji: "💖" },
  { slug: "health",        title: "Health & Fitness",        sub: "Sleep, steps, nutrition",               emoji: "🏋️" },
  { slug: "tech",          title: "Technology & Screen Time", sub: "Screen time, social media",           emoji: "📱" },
  { slug: "productivity",  title: "Productivity & Focus",    sub: "Focus span, study, hours",             emoji: "⚡" },
  { slug: "habits",        title: "Habits & Daily Life",     sub: "Caffeine, morning or night, books",    emoji: "☕" },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Human Average — Discover how average you really are</title>
        <meta name="description" content="Clean design, bold accents and real benchmarks. Browse averages by topic, then take short tests for a personal comparison." />
      </Head>

      <section className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Discover how average you really are
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Clean design, bold accents and real benchmarks. Browse the data, then take short tests for a personal comparison.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href="#topics" className="btn btn-primary px-4 py-2 rounded-full bg-sky-600 text-white hover:bg-sky-700">Explore topics</a>
            <Link href="/test/savings" className="btn px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50">Try the savings test</Link>
          </div>
        </header>

        <section id="topics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {CATS.map(c => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="card p-6 hover:shadow-lg transition-shadow"
              aria-label={`${c.title} — open`}
            >
              <div className="text-4xl mb-4">{c.emoji}</div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="text-sm text-gray-600">{c.sub}</p>
            </Link>
          ))}
        </section>
      </section>
    </>
  );
}
