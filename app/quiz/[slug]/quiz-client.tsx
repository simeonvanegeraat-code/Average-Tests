// app/quiz/[slug]/quiz-client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuizDataBySlug } from "@/lib/quizzes";
import QuizQuestion from "@/components/QuizQuestion";
import QuizProgress from "@/components/QuizProgress";

export default function QuizClient({ slug }: { slug: string }) {
  const router = useRouter();
  const data = getQuizDataBySlug(slug);
  const [answers, setAnswers] = useState<Record<string, { id: string; weight: number }>>({});
  const total = data?.questions.length || 0;

  const currentIndex = useMemo(() => {
    // first unanswered
    if (!data) return 0;
    for (let i = 0; i < data.questions.length; i++) {
      if (!answers[data.questions[i].id]) return i;
    }
    return data.questions.length; // complete
  }, [answers, data]);

  if (!data) return null;

  const current = data.questions[currentIndex];

  function onSelect(opt: { id: string; label: string; weight: number }) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: { id: opt.id, weight: opt.weight } }));
  }

  function onNext() {
    if (!current) return;
    if (!answers[current.id]) {
      alert("Please choose an answer.");
      return;
    }
    // move to next (just state causes re-render)
  }

  function onSubmit() {
    // compute score
    const score = Object.values(answers).reduce((sum, a) => sum + a.weight, 0);
    const max = (data.questions.length * 4);
    const percent = Math.round((score / max) * 100);

    // push to result page
    router.push(`/quiz/${slug}/result?score=${score}&max=${max}&pct=${percent}`);
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <QuizProgress current={Math.min(answeredCount + 1, total)} total={total} />

      {current ? (
        <>
          <QuizQuestion
            prompt={current.prompt}
            options={current.options}
            value={answers[current.id]?.id}
            onChange={onSelect}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {answeredCount} / {total} answered
            </p>
            <div className="flex gap-3">
              <button
                onClick={onNext}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Next
              </button>
              {answeredCount === total ? (
                <button
                  onClick={onSubmit}
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900"
                >
                  See my result
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        // All answered
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
