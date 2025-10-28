import Head from "next/head";
import { useRouter } from "next/router";
import CategoryPage from "@/components/CategoryPage";

// Data per categorie
import moneyStats from "@/data/averages/money.json";
import incomeStats from "@/data/averages/income.json";
import debtStats from "@/data/averages/debt.json";
import healthStats from "@/data/averages/health.json";
import lifestyleStats from "@/data/averages/lifestyle.json";
import productivityStats from "@/data/averages/productivity.json";
import techStats from "@/data/averages/tech.json";
import habitsStats from "@/data/averages/habits.json";

const EMPTY: any[] = [];

const META: Record<
  string,
  { title: string; subtitle: string; emoji: string; stats: any[]; cta?: { href: string; label?: string } }
> = {
  money: {
    title: "Money & Savings",
    subtitle: "Savings, wealth, investing",
    emoji: "💰",
    stats: (moneyStats as any[]) ?? EMPTY,
    cta: { href: "/test/savings", label: "Try the savings test" }
  },
  income: {
    title: "Income & Work",
    subtitle: "Salary by age, hours, side gigs",
    emoji: "💼",
    stats: (incomeStats as any[]) ?? EMPTY
  },
  debt: {
    title: "Debt & Spending",
    subtitle: "Debts, rent, spending habits",
    emoji: "🧾",
    stats: (debtStats as any[]) ?? EMPTY
  },
  health: {
    title: "Health & Fitness",
    subtitle: "Sleep, steps, nutrition",
    emoji: "🏋️",
    stats: (healthStats as any[]) ?? EMPTY
  },
  lifestyle: {
    title: "Lifestyle & Relationships",
    subtitle: "Status, housing, friends, kids",
    emoji: "💖",
    stats: (lifestyleStats as any[]) ?? EMPTY
  },
  productivity: {
    title: "Productivity & Focus",
    subtitle: "Focus span, study, hours",
    emoji: "⚡",
    stats: (productivityStats as any[]) ?? EMPTY
  },
  tech: {
    title: "Technology & Screen Time",
    subtitle: "Screen time, social media",
    emoji: "📱",
    stats: (techStats as any[]) ?? EMPTY
  },
  habits: {
    title: "Habits & Daily Life",
    subtitle: "Caffeine, morning or night, books",
    emoji: "☕",
    stats: (habitsStats as any[]) ?? EMPTY
  }
};

export default function CategorySlugPage() {
  const { query } = useRouter();
  const slug = (query.slug as string) || "money";
  const M = META[slug] ?? META.money;

  const intro =
    slug === "money" ? (
      <div className="prose max-w-none">
        <h3>Average savings and net wealth by age and region</h3>
        <p>
          This page shows <strong>average monthly savings</strong>, <strong>savings rates</strong> and
          snapshots of <strong>net household wealth</strong>. We include both <em>mean</em> and <em>median</em>.
        </p>
        <h4>Method and sources</h4>
        <p>
          Benchmarks are compiled from official statistics such as <strong>Eurostat</strong> and the{" "}
          <strong>ECB HFCS</strong>. Where needed we derive monthly amounts from saving rates and
          disposable income. Check the source link under each card for details.
        </p>
      </div>
    ) : slug === "income" ? (
      <div className="prose max-w-none">
        <h3>Income and work benchmarks</h3>
        <p>
          Explore <strong>annual salary</strong>, <strong>hours worked per week</strong> and other
          labour-market metrics by continent and age group.
        </p>
      </div>
    ) : slug === "habits" ? (
      <div className="prose max-w-none">
        <h3>Habits and daily life</h3>
        <p>
          Typical values by continent and age group for <strong>books per year</strong>,
          <strong> morning/evening preference</strong> and <strong>eating-out</strong>.
        </p>
      </div>
    ) : undefined;

  return (
    <>
      <Head>
        <title>{M.title} • Human Average</title>
        <meta name="description" content={`${M.title}: ${M.subtitle}. Compare mean & median by continent and age group.`} />
      </Head>

      <main className="container space-y-6 py-6">
        <CategoryPage
          title={M.title}
          subtitle={M.subtitle}
          emoji={M.emoji}
          stats={M.stats}
          intro={intro}
          ctaHref={M.cta?.href}
          ctaLabel={M.cta?.label || "Take the test"}
        />
      </main>
    </>
  );
}
