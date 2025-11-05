// app/insights/page.tsx
import type { Metadata } from "next";
import { QUIZZES } from "@/lib/quizzes";
import { getLearnMoreBySlug } from "@/lib/learnMore";

export const metadata: Metadata = {
  title: "Insights — HumanAverage",
  description:
    "Evidence-informed insights that power our quizzes: practical tips, sources, and context.",
  alternates: { canonical: "https://www.humanaverage.com/insights" },
  openGraph: {
    title: "Insights — HumanAverage",
    description:
      "Evidence-informed insights that power our quizzes: practical tips, sources, and context.",
    url: "https://www.humanaverage.com/insights",
    siteName: "HumanAverage",
    images: ["/og-default.png"],
    type: "website",
  },
};

export default function InsightsIndexPage() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Data & Insights
        </h1>
        <p className="mt-3 text-gray-600">
          The science and practical know-how behind our quizzes — curated
          sources and actionable tips.
        </p>
      </header>

      <section className="space-y-8">
        {QUIZZES.map((q) => {
          const lm = getLearnMoreBySlug(q.slug);
          return (
            <article
              key={q.slug}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={q.image || "/og-default.png"}
                    alt=""
                    className="w-28 h-20 rounded object-cover border border-gray-100"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{lm.title}</h2>
                    <p className="text-gray-600 mt-1">{lm.intro}</p>
                  </div>
                </div>

                {/* Tips */}
                {lm.tips?.length ? (
                  <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-gray-700">
                    {lm.tips.slice(0, 6).map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {/* Sources */}
                {lm.sources?.length ? (
                  <div className="mt-4 text-sm">
                    <div className="text-gray-500 mb-1">Sources:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {lm.sources.slice(0, 4).map((s, i) => (
                        <li key={i}>
                          <a
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-700 hover:underline"
                          >
                            {s.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Footer CTA */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={`/quiz/${q.slug}`}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Take the {q.title.replace(/:.*/, "")} Test
                  </a>
                  <a
                    href={`/take-a-test`}
                    className="inline-flex items-center px-4 py-2 rounded-lg border hover:bg-gray-50"
                  >
                    Explore all tests
                  </a>
                </div>

                {lm.disclaimer ? (
                  <p className="mt-4 text-xs text-gray-500">{lm.disclaimer}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
