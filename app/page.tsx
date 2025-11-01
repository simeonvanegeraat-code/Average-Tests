// app/page.tsx
import { QUIZZES } from "@/lib/quizzes";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="text-center">
        <h1 className="text-3xl font-bold mb-2">Are you above or below average?</h1>
        <p className="text-gray-600">
          Take quick, data-inspired quizzes and see how you compare.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {QUIZZES.map((q) => (
          <Link
            key={q.slug}
            href={`/quiz/${q.slug}`}
            className="block bg-white shadow hover:shadow-lg transition rounded-xl p-4"
          >
            <img
              src={q.image || "/og-default.png"}
              alt=""
              className="rounded-md mb-3"
            />
            <h3 className="font-bold text-lg">{q.title}</h3>
            <p className="text-gray-500 text-sm">{q.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
