// app/quiz/page.tsx
import { QUIZZES } from "@/lib/quizzes";
import Link from "next/link";

export const metadata = {
  title: "Quizzes • HumanAverage",
  description: "Discover our quick, insightful quizzes and see how you compare.",
  alternates: { canonical: "https://www.humanaverage.com/quiz" },
};

export default function QuizIndexPage() {
  return (
    <main className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold">Quizzes</h1>
        <p className="text-gray-600">Quick tests built for insights and simple comparisons.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        {QUIZZES.map((q) => (
          <Link
            key={q.slug}
            href={`/quiz/${q.slug}`}
            className="block bg-white rounded-xl border shadow-sm hover:shadow-lg transition p-4"
          >
            <img src={q.image || "/og-default.png"} alt="" className="rounded-lg mb-3" />
            <h3 className="font-bold text-lg">{q.title}</h3>
            <p className="text-gray-600 text-sm">{q.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
