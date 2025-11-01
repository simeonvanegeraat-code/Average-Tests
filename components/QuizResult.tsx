// components/QuizResult.tsx
"use client";

import { useMemo } from "react";

export default function QuizResult({
  percent,
  title,
  label,
  summary,
  shareUrl,
}: {
  percent: number;
  title: string;
  label: string;
  summary: string;
  shareUrl: string; // canonical to quiz overview or result
}) {
  const safeUrl = encodeURIComponent(shareUrl);
  const text = `${title} — I scored ${percent}% on HumanAverage!`;
  const textEncoded = encodeURIComponent(text);

  const dash = useMemo(() => {
    // circumference for r=80 is ~ 2πr = ~502
    // We'll map percent to stroke length
    const max = 502;
    return `${Math.round((percent / 100) * max)}, ${max}`;
  }, [percent]);

  return (
    <div className="text-center space-y-6 bg-white rounded-2xl border shadow p-8">
      <h1 className="text-2xl md:text-3xl font-extrabold">{label}</h1>
      <p className="text-gray-600 max-w-xl mx-auto">{summary}</p>

      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" stroke="#e5e7eb" strokeWidth="14" fill="none" />
          <circle
            cx="100"
            cy="100"
            r="80"
            stroke="#4f46e5"
            strokeWidth="14"
            fill="none"
            strokeDasharray={dash}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl font-extrabold text-indigo-700">{percent}%</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${textEncoded}&url=${safeUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900"
        >
          Share on X
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${safeUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-[#1877F2] text-white hover:bg-[#145dbf]"
        >
          Share on Facebook
        </a>
        <a
          href={`https://www.reddit.com/submit?url=${safeUrl}&title=${textEncoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
        >
          Share on Reddit
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}
