// app/take-a-test/page.tsx
import type { Metadata } from "next";
import { QUIZZES } from "@/lib/quizzes";

export const metadata: Metadata = {
  title: "Take a Test — HumanAverage",
  description:
    "Explore all HumanAverage quizzes. Quick, data-inspired tests to discover how you compare.",
  alternates: { canonical: "https://www.humanaverage.com/take-a-test" },
  openGraph: {
    title: "Take a Test — HumanAverage",
    description:
      "Explore all HumanAverage quizzes. Quick, data-inspired tests to discover how you compare.",
    url: "https://www.humanaverage.com/take-a-test",
    siteName: "HumanAverage",
    images: ["/og-default.png"],
    type: "website",
  },
};

export default function TakeATestPage() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Take a Test
        </h1>
        <p className="mt-3 text-gray-600">
          Quick, behavior-based quizzes. No judgment — just insight.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {QUIZZES.map((q) => (
          <a
            key={q.slug}
            href={`/quiz/${q.slug}`}
            className="block rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-md transition"
          >
            <img
              src={q.image || "/og-default.png"}
              alt=""
              className="w-full h-40 object-cover"
              loading="lazy"
            />
            <div className="p-4">
              <h2 className="font-bold text-lg">{q.title}</h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                {q.description}
              </p>
              <div className="mt-3 inline-flex items-center text-indigo-600 font-medium">
                Take test<span className="ml-1">→</span>
              </div>
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
