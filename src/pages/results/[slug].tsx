import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import ResultCard from "@/components/ResultCard";
import tests from "@/data/tests";

export default function ResultPage() {
  const router = useRouter();
  const { slug, value, avg, delta, label } = router.query as {
    slug?: string; value?: string; avg?: string; delta?: string; label?: string;
  };

  const test = (tests as any[]).find(t => t.slug === slug);

  const valueNum = Number(value);
  const avgNum = Number(avg);
  const deltaNum = Number(delta);

  if (!test || Number.isNaN(valueNum) || Number.isNaN(avgNum) || Number.isNaN(deltaNum) || !label) {
    return <Layout title="Results"><div className="card">Invalid result.</div></Layout>;
  }

  const band = test.labels.find((b: any) => b.label === label);
  const advice = band?.advice ?? "";

  return (
    <Layout title={`${test.title} — Result`}>
      <div className="space-y-6">
        <ResultCard
          value={valueNum}
          avg={avgNum}
          delta={deltaNum}
          label={label}
          advice={advice}
          unit={test.unit || ""}
        />

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">What this means</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            We compared your input with a benchmark average for this category. Use the tips above to improve,
            or try another test to build your “average profile”.
          </p>

          <div className="mt-4 flex gap-3">
            <button
              className="btn btn-primary"
              onClick={() => {
                const share = `I scored ${valueNum}${test.unit || ""} — ${label.toLowerCase()} vs avg ${avgNum}${test.unit || ""} on ${test.title} #AverageTests`;
                if (navigator.share) {
                  navigator.share({ title: "Average Tests", text: share, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(`${share} ${window.location.href}`).catch(() => {});
                  alert("Copied share text to clipboard!");
                }
              }}
            >
              Share your score
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">More tests</h3>
          <ul className="list-disc ml-5">
            {(tests as any[]).filter(t => t.slug !== slug).slice(0, 4).map(t => (
              <li key={t.slug}>
                <a className="link" href={`/test/${t.slug}`}>{t.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
