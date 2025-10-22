import Head from "next/head";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About • Human Average</title>
        <meta
          name="description"
          content="Human Average is a modern data hub that lets you explore typical values by topic, region and age. Clear benchmarks first, quick personal tests later."
        />
      </Head>

      <main className="container py-10 space-y-8">
        <header className="card p-6">
          <h1 className="text-3xl font-extrabold tracking-tight">About Human Average</h1>
          <p className="text-gray-600 mt-2">
            Human Average helps you discover how typical you are—across money, work, lifestyle, health and more.
          </p>
        </header>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">What we do</h2>
          <p>
            We collect and summarize public statistics (for example Eurostat, OECD, national statistical offices) to
            present <strong>clear, comparable benchmarks</strong>. Where official figures don’t exist in the exact
            format we need, we derive understandable proxies (e.g. converting saving rates to estimated monthly amounts).
          </p>
          <p>
            You can browse trusted stats first and—optionally—take short tests for a lightweight personal comparison.
            Tests never require sensitive information and are designed for quick insight, not medical or financial advice.
          </p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Editorial principles</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Transparency:</strong> every card shows a source or method note.</li>
            <li><strong>Mean &amp; median:</strong> we prefer medians when distributions are skewed.</li>
            <li><strong>Scope:</strong> global or continental by default; countries and cities are added progressively.</li>
            <li><strong>Clarity:</strong> short copy, friendly visuals, accessible language.</li>
          </ul>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Who’s behind this?</h2>
          <p>
            Human Average is created by <strong>Simeon</strong>. You can reach me at{" "}
            <a className="underline underline-offset-2" href="mailto:firenature23@gmail.com">
              firenature23@gmail.com
            </a>.
          </p>
        </section>

        <section className="card p-6 space-y-2">
          <h2 className="text-xl font-semibold">Press &amp; contact</h2>
          <p>Email: <a className="underline underline-offset-2" href="mailto:firenature23@gmail.com">firenature23@gmail.com</a></p>
        </section>

        <p className="text-xs text-gray-500">Last updated: 2025-10-22</p>
      </main>
    </>
  );
}
