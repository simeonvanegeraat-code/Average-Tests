import Layout from "@/components/Layout";
import Link from "next/link";
import tests from "@/data/tests";

export default function Home() {
  return (
    <Layout title="Find out how average you are">
      <section className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Find out how average you really are</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Short, no-nonsense tests. We compare your input to the average of your region & age.
        </p>
      </section>

      <ul className="grid gap-5 grid-cols-1 md:grid-cols-2">
        {tests.map((t) => (
          <li key={t.slug} className="card">
            <h3 className="text-xl font-semibold">{t.title}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{t.intro}</p>
            <Link href={`/test/${t.slug}`} className="btn btn-primary mt-4">Start test</Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
