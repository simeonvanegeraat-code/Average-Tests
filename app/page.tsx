// app/page.tsx (kleine polish)
import { QUIZZES } from "@/lib/quizzes";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="text-center">
        <h1 className="text-3xl font-bold mb-2">Are you above or below average?</h1>
        <p className="text-gray-600">Take quick, data-inspired quizzes and see how you compare.</p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {QUIZZES.map((q) => (
          <Link
            key={q.slug}
            href={`/quiz/${q.slug}`}
            className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow hover:shadow-lg transition"
          >
            <img
              src={q.image || "/og-default.png"}
              alt={q.title}
              className="w-full aspect-[16/9] object-cover"
              loading="lazy"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg">{q.title}</h3>
              <p className="text-gray-500 text-sm">{q.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
