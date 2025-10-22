// src/pages/category/[slug].tsx
import Head from "next/head";
import { useRouter } from "next/router";
import CategoryPage from "@/components/CategoryPage";

// Data imports per categorie
import moneyStats from "@/data/averages/money.json"; // gebouwd door build-money-json.cjs

export default function CategorySlugPage() {
  const router = useRouter();
  const slug = (router.query.slug as string) || "money";

  if (slug !== "money") {
    // Placeholder voor andere categorieën totdat data beschikbaar is
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

  // Money & Savings content
  const intro = (
    <div className="prose max-w-none">
      <h3>Average savings and net wealth by age and region</h3>
      <p>
        On this page you’ll find <strong>average monthly savings</strong>, the{" "}
        <strong>median savings rate</strong>, and snapshots of{" "}
        <strong>net household wealth</strong>. We show both <em>mean</em> and{" "}
        <em>median</em> so you get a fair picture that isn’t skewed by a few very high earners.
      </p>
      <h4>Why this matters</h4>
      <ul>
        <li>Compare typical monthly savings for your age group and region.</li>
        <li>See how a savings rate turns income into long-term net wealth.</li>
        <li>Understand why medians are useful when distributions are skewed.</li>
      </ul>
      <h4>Method and sources</h4>
      <p>
        Benchmarks are compiled from official statistics such as <strong>Eurostat</strong> (saving rate and
        income) and the <strong>ECB HFCS</strong> for wealth distributions. Where needed we derive monthly
        amounts from saving rates and disposable income. Always check the source link under each card for details.
      </p>
    </div>
  );

  return (
    <>
      <Head>
        <title>Money &amp; Savings • Human Average</title>
        <meta
          name="description"
          content="See average monthly savings, savings rates and household net wealth by continent and age group. Compare mean vs median to get the full picture."
        />
      </Head>

      <main className="container space-y-6 py-6">
        <CategoryPage
          title="Money & Savings"
          subtitle="Savings, wealth, investing"
          emoji="💰"
          // Belangrijk: geef ALLE money-metrics door – de component filtert zelf op continent + age
          stats={moneyStats as any}
          intro={intro}
          ctaHref="/test/savings"
          ctaLabel="Try the savings test"
        />
      </main>
    </>
  );
}
