import * as React from "react";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import CategoryPage from "@/components/CategoryPage";

type StatItem = any; // keeps it simple for now

// Lazy loader so the page doesn't crash if a JSON isn't built yet
async function loadStats(slug: string): Promise<StatItem[] | null> {
  try {
    switch (slug) {
      case "money":
        return (await import("@/data/averages/money.json")).default as any[];
      case "income":
        return (await import("@/data/averages/income.json")).default as any[];
      case "debt":
        return (await import("@/data/averages/debt.json")).default as any[];
      case "lifestyle":
        return (await import("@/data/averages/lifestyle.json")).default as any[];
      case "health":
        return (await import("@/data/averages/health.json")).default as any[];
      case "tech":
        return (await import("@/data/averages/tech.json")).default as any[];
      case "productivity":
        return (await import("@/data/averages/productivity.json")).default as any[];
      case "habits":
        return (await import("@/data/averages/habits.json")).default as any[];
      default:
        return null;
    }
  } catch {
    return null; // JSON not present yet
  }
}

const META: Record<
  string,
  { title: string; subtitle: string; emoji: string; cta?: { href: string; label: string } }
> = {
  money:        { title: "Money & Savings",        subtitle: "Savings, wealth, investing",           emoji: "💰", cta: { href: "/test/savings", label: "Try the savings test" } },
  income:       { title: "Income & Work",          subtitle: "Salary by age, hours, side gigs",      emoji: "💼" },
  debt:         { title: "Debt & Spending",        subtitle: "Debts, rent, spending habits",         emoji: "🧾" },
  lifestyle:    { title: "Lifestyle & Relationships", subtitle: "Status, housing, friends, kids",    emoji: "💖" },
  health:       { title: "Health & Fitness",       subtitle: "Sleep, steps, nutrition",               emoji: "🏋️" },
  tech:         { title: "Technology & Screen Time", subtitle: "Screen time, social media",          emoji: "📱" },
  productivity: { title: "Productivity & Focus",   subtitle: "Focus span, study, hours",             emoji: "⚡" },
  habits:       { title: "Habits & Daily Life",    subtitle: "Caffeine, morning or night, books",    emoji: "☕" }
};

function Intro(slug: string) {
  const Common = () => (
    <>
      <h4>Why this matters</h4>
      <ul>
        <li>Typical values by continent and age group.</li>
        <li>We show mean and median where relevant.</li>
        <li>Benchmarks compiled from official statistics (demo values now).</li>
      </ul>
    </>
  );
  const blocks: Record<string, JSX.Element> = {
    money: (
      <div className="prose max-w-none">
        <h3>Average savings and net wealth</h3>
        <p>Explore monthly savings, savings rates and net household wealth by region and age.</p>
        <Common />
      </div>
    ),
    income: (
      <div className="prose max-w-none">
        <h3>Income and work patterns</h3>
        <p>Annual salary, hours, unemployment, remote work and side income across groups.</p>
        <Common />
      </div>
    ),
    debt: (
      <div className="prose max-w-none">
        <h3>Debt and spending</h3>
        <p>Household debt, median rent and indicative credit rates by region.</p>
        <Common />
      </div>
    ),
    lifestyle: (
      <div className="prose max-w-none">
        <h3>Lifestyle and relationships</h3>
        <p>First-child age, household size and homeownership benchmarks.</p>
        <Common />
      </div>
    ),
    health: (
      <div className="prose max-w-none">
        <h3>Health and fitness</h3>
        <p>Sleep, steps/day and obesity rates benchmarks.</p>
        <Common />
      </div>
    ),
    tech: (
      <div className="prose max-w-none">
        <h3>Technology and screen time</h3>
        <p>Screen time, internet and smartphone penetration across regions.</p>
        <Common />
      </div>
    ),
    productivity: (
      <div className="prose max-w-none">
        <h3>Productivity and focus</h3>
        <p>Focus span, study hours and coffee intake benchmarks.</p>
        <Common />
      </div>
    ),
    habits: (
      <div className="prose max-w-none">
        <h3>Habits and daily life</h3>
        <p>Morning person share, books per year and eating out frequency.</p>
        <Common />
      </div>
    ),
  };
  return blocks[slug] ?? null;
}

export default function CategorySlugPage() {
  const { query, isReady } = useRouter();
  const slug = isReady ? (query.slug as string) : undefined;

  const meta = slug ? META[slug] : undefined;
  const [stats, setStats] = useState<StatItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !slug) return;
    setLoading(true);
    loadStats(slug).then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, [isReady, slug]);

  if (!slug || !meta) {
    return (
      <>
        <Head><title>Category • Human Average</title></Head>
        <main className="container space-y-6 py-6">
          <section className="card p-6"><p>Loading…</p></section>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{meta.title} • Human Average</title>
        <meta name="description" content={`${meta.title} — ${meta.subtitle}. Compare typical values by continent and age group.`} />
      </Head>

      <main className="container space-y-6 py-6">
        {loading ? (
          <section className="card p-6"><p>Loading…</p></section>
        ) : !stats ? (
          <section className="card p-6">
            <h1 className="text-2xl font-bold">Coming soon</h1>
            <p className="text-gray-600">This category is not live yet. Add <code>src/data/averages/{slug}.json</code> via the build script.</p>
          </section>
        ) : (
          <CategoryPage
            title={meta.title}
            subtitle={meta.subtitle}
            emoji={meta.emoji}
            stats={stats}
            intro={Intro(slug)}
            ctaHref={meta.cta?.href}
            ctaLabel={meta.cta?.label}
          />
        )}
      </main>
    </>
  );
}
