// src/pages/category/[slug].tsx
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import categories from "@/data/categories.json";
import CategoryPage from "@/components/CategoryPage";

type Cat = {
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  dataFile: string;
};

export default function CategorySlugPage() {
  const { query } = useRouter();
  const { slug } = query as { slug?: string };

  if (!slug) {
    return (
      <Layout title="Category">
        <div className="card p-6">Loading…</div>
      </Layout>
    );
  }

  const cat = (categories as Cat[]).find((c) => c.slug === slug);

  if (!cat) {
    return (
      <Layout title="Not found">
        <div className="card p-6">Category not found.</div>
      </Layout>
    );
  }

  // JSON met gemiddelden (MVP: eenvoudige require)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const stats = require(`@/data/averages/${cat.dataFile}`);

  // SEO-intro per categorie
  const introBySlug: Record<string, JSX.Element> = {
    money: (
      <div>
        <h2 className="text-xl font-bold mb-2">Average savings and wealth</h2>
        <p className="text-gray-700">
          This page shows typical money metrics like <strong>average monthly savings</strong>, the
          <strong> median</strong> for your age group, and snapshots of <strong>net wealth</strong>.
          We include both mean and median so the view is fair even when a few high earners skew the data.
        </p>
        <ul className="list-disc pl-5 mt-3 text-gray-700 space-y-1">
          <li>Compare savings by age and region</li>
          <li>See the gap between mean and median</li>
          <li>Use the test to check your own savings rate</li>
        </ul>
        <p className="mt-3 text-gray-700">
          Numbers come from official statistics or large surveys. Replace placeholder values with your verified sources in the data files.
        </p>
      </div>
    ),
    // generieke intro voor andere categorieën (kan je per stuk uitbreiden)
    work: (
      <div>
        <h2 className="text-xl font-bold mb-2">Average income and work hours</h2>
        <p className="text-gray-700">
          Explore typical net income by age and region. Check weekly hours and how they vary by country.
        </p>
      </div>
    ),
    debt: (
      <div>
        <h2 className="text-xl font-bold mb-2">Debt and spending patterns</h2>
        <p className="text-gray-700">
          See average rent, common consumer debt balances and spending habits across regions.
        </p>
      </div>
    ),
    lifestyle: (
      <div>
        <h2 className="text-xl font-bold mb-2">Lifestyle and relationships</h2>
        <p className="text-gray-700">
          Learn how living situations and relationship patterns differ by age group.
        </p>
      </div>
    ),
    health: (
      <div>
        <h2 className="text-xl font-bold mb-2">Health and fitness averages</h2>
        <p className="text-gray-700">
          Typical sleep, steps and basic wellbeing indicators from trusted sources.
        </p>
      </div>
    ),
    tech: (
      <div>
        <h2 className="text-xl font-bold mb-2">Technology and screen time</h2>
        <p className="text-gray-700">
          Average daily screen time and social media use for different age groups.
        </p>
      </div>
    ),
    productivity: (
      <div>
        <h2 className="text-xl font-bold mb-2">Productivity and focus</h2>
        <p className="text-gray-700">
          Typical focus session length and study hours so you can benchmark your routine.
        </p>
      </div>
    ),
    habits: (
      <div>
        <h2 className="text-xl font-bold mb-2">Daily habits</h2>
        <p className="text-gray-700">
          Caffeine intake and reading habits gathered from surveys and reports.
        </p>
      </div>
    ),
  };

  const intro = introBySlug[slug] ?? null;

  // CTA alleen tonen bij Money (voor nu)
  const ctaHref =
    slug === "money" ? "/test/global-monthly-savings-plus-wealth" : undefined;
  const ctaLabel =
    slug === "money" ? "Take the savings test" : "Take the test";

  return (
    <Layout title={cat.title} description={cat.subtitle}>
      <CategoryPage
        title={cat.title}
        subtitle={cat.subtitle}
        emoji={cat.emoji}
        stats={stats}
        intro={intro}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
      />
    </Layout>
  );
}
