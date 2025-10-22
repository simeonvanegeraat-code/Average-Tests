import Layout from "@/components/Layout";
import CategoryCard from "@/components/CategoryCard";
import categories from "@/data/categories.json";

type Cat = {
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
};

export default function Home() {
  return (
    <Layout title="Average Tests" description="Explore real-world averages across money, work, lifestyle, health, tech, productivity and daily habits.">
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover how average you really are</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Browse trusted stats and see typical values across topics. Later you can take short tests for a personal comparison.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(categories as Cat[]).map((c) => (
          <CategoryCard key={c.slug} slug={c.slug} title={c.title} subtitle={c.subtitle} emoji={c.emoji} color={c.color} />
        ))}
      </section>
    </Layout>
  );
}
