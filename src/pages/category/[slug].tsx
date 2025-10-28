// src/pages/category/[slug].tsx
import Head from "next/head";
import { useRouter } from "next/router";
import CategoryPage from "@/components/CategoryPage";

// Data
import moneyStats from "@/data/averages/money.json";
import habitsStats from "@/data/averages/habits.json";

export default function CategorySlugPage() {
  const router = useRouter();
  const slug = (router.query.slug as string) || "money";

  // MONEY
  if (slug === "money") {
    const intro = (
      <div className="prose max-w-none">
        <h3>Average savings and net wealth by age and region</h3>
        <p>
          On this page you’ll find <strong>average monthly savings</strong>, the{" "}
          <strong>median savings rate</strong>, and snapshots of <strong>net household wealth</strong>. We
          show both <em>mean</em> and <em>median</em> for a balanced picture.
        </p>
        <h4>Why this matters</h4>
        <ul>
          <li>Compare monthly savings for your age group and region.</li>
          <li>See how a savings rate can compound into long-term wealth.</li>
          <li>Understand why medians help when distributions are skewed.</li>
        </ul>
        <h4>Method & sources</h4>
        <p>
          Benchmarks use official statistics such as <strong>Eurostat</strong> and the{" "}
          <strong>ECB HFCS</strong>. Where needed, monthly amounts are derived from saving rates and disposable
          income. Check the source link on each card for details.
        </p>
      </div>
    );

    return (
      <>
        <Head>
          <title>Money &amp; Savings • Human Average</title>
          <meta
            name="description"
            content="See average monthly savings, savings rates, and household net wealth by continent and age group. Compare mean and median."
          />
        </Head>
        <main className="container space-y-6 py-6">
          <CategoryPage
            title="Money & Savings"
            subtitle="Savings, wealth, investing"
            emoji="💰"
            stats={moneyStats as any}
            intro={intro}
            ctaHref="/test/savings"
            ctaLabel="Try the savings test"
          />
        </main>
      </>
    );
  }

  // HABITS
  if (slug === "habits") {
    const intro = (
      <div className="prose max-w-none">
        <h3>Habits and daily life</h3>
        <p>
          Morning person share, books per year, and eating-out frequency. Values are shown by{" "}
          <strong>continent</strong> and <strong>age group</strong>. We present mean and median where relevant.
        </p>
        <h4>Why this matters</h4>
        <ul>
          <li>Understand typical daily patterns for your age group and region.</li>
          <li>Use the metrics to benchmark lifestyle choices over time.</li>
        </ul>
        <h4>Method & sources</h4>
        <p>
          Benchmarks are compiled from recognized surveys and official statistics. Where appropriate, global
          values are aggregated from continental data (unweighted).
        </p>
      </div>
    );

    return (
      <>
        <Head>
          <title>Habits &amp; Daily Life • Human Average</title>
          <meta
            name="description"
            content="See habits by continent and age group: morning person share, books per year, and eating-out frequency."
          />
        </Head>
        <main className="container space-y-6 py-6">
          <CategoryPage
            title="Habits & Daily Life"
            subtitle="Caffeine, morning or night, books"
            emoji="☕"
            stats={habitsStats as any}
            intro={intro}
          />
        </main>
      </>
    );
  }

  // Placeholder voor (nog) niet gebouwde categorieën
  return (
    <>
      <Head>
        <title>Category • Human Average</title>
      </Head>
      <main className="container space-y-6 py-6">
        <header className="card p-6">
          <h1 className="text-2xl font-bold">Coming soon</h1>
          <p className="text-gray-600">This category is not live yet.</p>
        </header>
      </main>
    </>
  );
}
