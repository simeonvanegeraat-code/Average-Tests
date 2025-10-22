import Head from "next/head";
import { useRouter } from "next/router";
import CategoryPage from "@/components/CategoryPage";

// kleine helper om JSON per slug dynamisch te importeren
async function loadStats(slug: string) {
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
    return null; // JSON bestaat nog niet
  }
}

// copy-safe intro per categorie (korte SEO-tekst)
function introBlock(slug: string) {
  const common = (
    <>
      <h4>Why this matters</h4>
      <ul>
        <li>See typical values by continent and age group.</li>
        <li>We show both mean and median where relevant.</li>
        <li>Benchmarks compiled from official statistics; demo values can be replaced with source data.</li>
      </ul>
    </>
  );

  const map: Record<string, JSX.Element> = {
    money: (
      <div className="prose max-w-none">
        <h3>Average savings and net wealth</h3>
        <p>
          Explore <strong>monthly savings</strong>, <strong>savings rates</strong> and snapshots of
          <strong> net household wealth</strong>. Use the benchmarks to see how typical households manage
          their money across age groups and regions.
        </p>
        {common}
      </div>
    ),
    income: (
      <div className="prose max-w-none">
        <h3>Income and work patterns</h3>
        <p>
          Compare <strong>annual salary</strong>, <strong>hours worked</strong>, unemployment and the
          share of <strong>remote work</strong> or side income. Useful to understand labour outcomes by age and region.
        </p>
        {common}
      </div>
    ),
    debt: (
      <div className="prose max-w-none">
        <h3>Debt and spending</h3>
        <p>
          See typical <strong>household debt</strong>, <strong>median rent</strong> and indicative
          <strong> credit rates</strong> to put saving and income in context.
        </p>
        {common}
      </div>
    ),
    lifestyle: (
      <div className="prose max-w-none">
        <h3>Lifestyle and relationships</h3>
        <p>
          Benchmarks for <strong>first-child age</strong>, <strong>household size</strong> and
          <strong> homeownership</strong> across regions.
        </p>
        {common}
      </div>
    ),
    health: (
      <div className="prose max-w-none">
        <h3>Health and fitness</h3>
        <p>
          Typical <strong>sleep</strong>, <strong>steps/day</strong> and <strong>obesity rates</strong>.
        </p>
        {common}
      </div>
    ),
    tech: (
      <div className="prose max-w-none">
        <h3>Technology and screen time</h3>
        <p>
          Explore <strong>screen time</strong>, <strong>internet penetration</strong> and
          <strong> smartphone adoption</strong>.
        </p>
        {common}
      </div>
    ),
    productivity: (
      <div className="prose max-w-none">
        <h3>Productivity and focus</h3>
        <p>
          Benchmarks for <strong>focus span</strong>, <strong>study hours</strong> and
          <strong> coffee intake</strong>.
        </p>
        {common}
      </div>
    ),
    habits: (
      <div className="prose max-w-none">
        <h3>Habits and daily life</h3>
        <p>
          Typical shares of <strong>morning people</strong>, <strong>books per year</strong> and
          <strong> eating out</strong>.
        </p>
        {common}
      </div>
    ),
  };

  return map[slug] ?? null;
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
  habits:       { title: "Habits & Daily Life",    subtitle: "Caffeine, morning or night, books",    emoji: "☕" },
};

export default function CategorySlugPage() {
  const { query, isReady } = useRouter();
  const slug = (query.slug as string) || "money";
  const meta = META[slug];

  // CSR fetch van JSON: eenvoudig en robuust
  const [stats, setStats] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  // lazy import (client-side) zodat build niet faalt als JSON nog niet bestaat
  React.useEffect(() => {
    if (!isReady) return;
    setLoading(true);
    loadStats(slug).then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, [isReady, slug]);

  if (!meta) {
    return (
      <>
        <Head><title>Category • Human Average</title></Head>
        <main className="container space-y-6 py-6">
          <header className="card p-6">
            <h1 className="text-2xl font-bold">Unknown category</h1>
            <p className="text-gray-600">We couldn't find this category.</p>
          </header>
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
            stats={stats as any}
            intro={introBlock(slug)}
            ctaHref={meta.cta?.href}
            ctaLabel={meta.cta?.label}
          />
        )}
      </main>
    </>
  );
}

// imports die hierboven gebruikt worden
import * as React from "react";
import { useState } from "react";
