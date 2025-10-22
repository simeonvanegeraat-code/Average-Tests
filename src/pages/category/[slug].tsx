import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import categories from "@/data/categories.json";
import dynamic from "next/dynamic";
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
        <div className="card">Loading…</div>
      </Layout>
    );
  }

  const cat = (categories as Cat[]).find((c) => c.slug === slug);

  if (!cat) {
    return (
      <Layout title="Not found">
        <div className="card">Category not found.</div>
      </Layout>
    );
  }

  // Statisch importeren op basis van dataFile naam
  // (Next.js bundelt JSON. Simpel en snel voor MVP.)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const stats = require(`@/data/averages/${cat.dataFile}`);

  return (
    <Layout title={cat.title} description={cat.subtitle}>
      <CategoryPage title={cat.title} subtitle={cat.subtitle} emoji={cat.emoji} stats={stats} />
    </Layout>
  );
}
