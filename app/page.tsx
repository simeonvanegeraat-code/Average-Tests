// app/page.tsx
import Link from "next/link";
import { QUIZZES } from "@/lib/quizzes";

export default function HomePage() {
  // Kies 3 uitgelichte (eerste drie in QUIZZES; later kun je er een "featured" vlag aan geven)
  const featured = QUIZZES.slice(0, 3);

  return (
    <main className="space-y-12">
      {/* Hero */}
      <section className="text-center bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Are you above or below average?
        </h1>
        <p className="mt-3 text-gray-600">
          Take quick, data-informed quizzes and see how you compare.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/take-a-test"
            className="inline-flex items-center rounded-lg bg-indigo-600 text-white px-5 py-2.5 font-semibold hover:bg-indigo-700 transition"
          >
            Take a test <span aria-hidden className="ml-1">→</span>
          </Link>
          <Link
            href="/insights"
            className="inline-flex items-center rounded-lg border px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Read insights
          </Link>
        </div>
      </section>

      {/* Featured tests */}
      <section className="space-y-4">
        <header className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Featured tests</h2>
          <Link
            href="/take-a-test"
            className="text-indigo-600 font-medium hover:underline"
          >
            View all
          </Link>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {featured.map((q) => (
            <Link
              key={q.slug}
              href={`/quiz/${q.slug}`}
              className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <img
                src={q.image || "/og-default.png"}
                alt={q.title}
                className="w-full aspect-[16/9] object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <h3 className="font-bold">{q.title}</h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                  {q.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
