'use client';
import { useState } from 'react';
import type { Quiz, QuizQuestion } from '@/lib/quizzes';

export default function QuizClient({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);

  const totalMax = quiz.questions.reduce((sum, q) => sum + 3, 0);

  function handleSelect(q: QuizQuestion, weight: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: weight }));
  }

  function submit() {
    if (Object.keys(answers).length < quiz.questions.length)
      return alert('Please answer all questions.');

    const s = Object.values(answers).reduce((a, b) => a + b, 0);
    setScore(s);
  }

  function getLabel(s: number) {
    const ratio = s / totalMax;
    if (ratio < 0.4) return quiz.resultLabels.low;
    if (ratio < 0.7) return quiz.resultLabels.mid;
    return quiz.resultLabels.high;
  }

  if (score !== null) {
    const label = getLabel(score);
    return (
      <div className="text-center space-y-4 bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold">Your Result</h2>
        <p className="text-lg">{label}</p>
        <p className="text-gray-500 text-sm">Score: {score}/{totalMax}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {quiz.questions.map((q) => (
        <div key={q.id} className="p-4 border rounded-lg bg-white shadow-sm">
          <p className="font-medium mb-2">{q.prompt}</p>
          <div className="flex flex-col gap-2">
            {q.options.map((o) => (
              <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === o.weight}
                  onChange={() => handleSelect(q, o.weight)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={submit}
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
      >
        See my result
      </button>
    </div>
  );
}
