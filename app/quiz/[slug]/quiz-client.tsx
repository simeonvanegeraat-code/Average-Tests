"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getQuizDataBySlug } from "@/lib/quizzes";
import QuizQuestion from "@/components/QuizQuestion";
import QuizProgress from "@/components/QuizProgress";

export default function QuizClient({ slug }: { slug: string }) {
  const router = useRouter();
  const data = getQuizDataBySlug(slug);
  const [answers, setAnswers] = useState<Record<string, { id: string; weight: number }>>({});
  const [index, setIndex] = useState(0);

  if (!data) return null;

  const total = data.questions.length;
  const current = data.questions[index];
  const answeredCount = Object.keys(answers).length;

  // ✅ Wanneer gebruiker iets selecteert
  function onSelect(opt: { id: string; label: string; weight: number }) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: { id: opt.id, weight: opt.weight } }));
  }

  // ✅ Ga naar volgende vraag
  function onNext() {
    if (!answers[current.id]) {
      alert("Please choose an answer before continuing.");
      return;
    }
    if (index < total - 1) setIndex((i) => i + 1);
  }

  // ✅ Ga terug naar vorige vraag
  function onBack() {
    if (index > 0) setIndex((i) => i - 1);
  }

  // ✅ Bereken resultaat en navigeer naar resultaatpagina
  function onSubmit() {
    const score = Object.values(answers).reduce((sum, a) => sum + a.weight, 0);
    const max = total * 4;
    const percent = Math.round((score / max) * 100);
    router.push(`/quiz/${slug}/result?score=${score}&max=${max}&pct=${percent}`);
  }

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <QuizProgress current={index + 1} total={total} />

      {current ? (
        <>
          <QuizQuestion
            prompt={current.prompt}
            options={current.options}
            value={answers[current.id]?.id}
            onChange={onSelect}
          />

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={onBack}
              disabled={index === 0}
              className={`px-4 py-2 rounded-lg border ${
                index === 0
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-800 border-gray-300 hover:bg-gray-100"
              }`}
            >
              Back
            </button>

            {index < total - 1 ? (
              <button
                onClick={onNext}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onSubmit}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900"
              >
                See my result
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center space-y-4 bg-white border rounded-xl p-8">
          <h2 className="text-xl font-bold">Ready to see your score?</h2>
          <p className="text-gray-600">You’ve answered all {total} questions.</p>
          <button
            onClick={onSubmit}
            className="px-5 py-3 rounded-lg bg-black text-white hover:bg-gray-900"
          >
            Show result
          </button>
        </div>
      )}
    </section>
  );
}
