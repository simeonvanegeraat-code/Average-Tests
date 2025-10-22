// src/pages/category/[slug].tsx
import Head from "next/head";
import { useRouter } from "next/router";
import CategoryPage from "@/components/CategoryPage";

// Data imports (JSON wordt gebouwd door de build-scripts)
import moneyStats from "@/data/averages/money.json";
import incomeStats from "@/data/averages/income.json";

export default function CategorySlugPage() {
  const router = useRouter();
  const slug = (router.query.slug as string) || "money";

  if (slug === "income") {
    const intro = (
      <div className="prose max-w-none">
        <h3>Income and work patterns by age and region</h3>
        <p>
          Explore <strong>annual salary</strong>, <strong>hours worked</strong>, and key labour trends like
          <strong> side income</strong>, <strong>remote work</strong>, and <strong>job switching</strong>.
          Where possible we show both <em>mean</em> and <em>median</em> for a fair view.
        </p>
        <p className="text-sm text-gray-600">
          Benchmarks compiled from OECD, ILO and national statistics. Global values are unweighted averages across continents.
        </p>
      </div>
    );

    return (
      <>
        <Head>
          <title>Income &amp; Work • Human Average</title>
          <meta
            name="description"
            content="Average salary, hours worked, unemployment, side gigs, remote work and more by continent and age."
          />
        </Head>

        <CategoryPage
          title="Income & Work"
          subtitle="Salary by age, hours, trends"
          emoji="💼"
          stats={incomeStats as any}
          intro={intro}
        />
      </>
    );
  }

  // Money & Savings (default)
  const intro = (
    <div className="prose max-w-none">
      <h3>Average savings and net wealth by age and region</h3>
      <p>
        On this page you’ll find <strong>average monthly savings</strong>, the{" "}
        <strong>median savings rate</strong>, and snapshots of <strong>net household wealth</strong>.
        We show both <em>mean</em> and <em>median</em> so you get a fair picture that isn’t
        skewed by a few very high values.
      </p>
      <h4>Why this matters</h4>
      <ul>
        <li>Compare typical monthly savings for your age group and region.</li>
        <li>See how a savings rate turns income into long-term net wealth.</li>
        <li>Understand why medians are useful when distributions are skewed.</li>
      </ul>
      <h4>Method and sources</h4>
      <p>
        Benchmarks are compiled from official statistics such as <strong>Eurostat</strong> (saving rate and income)
        and the <strong>ECB HFCS</strong> for wealth distributions. Monthly amounts are derived from saving rates and
        disposable income. Check the source link under each card for details.
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

      <CategoryPage
        title="Money & Savings"
        subtitle="Savings, wealth, investing"
        emoji="💰"
        stats={moneyStats as any}
        intro={intro}
        ctaHref="/test/savings"
        ctaLabel="Try the savings test"
      />
    </>
  );
}
