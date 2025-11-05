// app/quiz/[slug]/result/page.tsx
import type { Metadata } from "next";
import ResultLearnMore from "@/components/ResultLearnMore";
import ResultShare from "@/components/ResultShare";
import { getQuizMetaBySlug, getQuizDataBySlug } from "@/lib/quizzes";
import { getLearnMoreBySlug } from "@/lib/learnMore";

type ResultSearchParams = { score?: string; max?: string; pct?: string };

export function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: ResultSearchParams;
}): Metadata {
  const meta = getQuizMetaBySlug(params.slug);
  const pct = Number(searchParams.pct ?? 0);

  // Voor personality tonen we geen % in de title
  const isPersonality = params.slug === "introvert-extrovert";
  const title = meta
    ? isPersonality
      ? `${meta.title} — Your Result`
      : `${meta.title} — Your Result: ${pct}%`
    : `Your Quiz Result`;

  return {
    title,
    description:
      meta?.description ??
      "See your personalized quiz result and learn how you compare to others.",
  };
}

export default function ResultPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: ResultSearchParams;
}) {
  const quiz = getQuizDataBySlug(params.slug);
  if (!quiz) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p>Quiz not found.</p>
      </main>
    );
  }

  const score = Number(searchParams.score || 0);
  const max = Number(searchParams.max || 1);
  const pct = Math.min(
    100,
    Math.max(0, Number(searchParams.pct ?? Math.round((score / max) * 100)))
  );

  const { label, summary } = quiz.interpret(pct);
  const isPersonality = quiz.slug === "introvert-extrovert";

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${quiz.title} — Result`,
    description: summary,
    mainEntityOfPage: `https://www.humanaverage.com/quiz/${quiz.slug}/result`,
    author: { "@type": "Organization", name: "HumanAverage" },
  };

  // Circle progress (voor niet-personality)
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = (pct / 100) * circumference;

  // Server-side fallback URL
  const shareUrl = `https://www.humanaverage.com/quiz/${quiz.slug}/result?score=${score}&max=${max}&pct=${pct}`;

  // Per-quiz Learn More
  const lm = getLearnMoreBySlug(params.slug);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          {label}
        </h1>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">{summary}</p>

        {/* Visualization */}
        {isPersonality ? (
          // ───────── Spectrum (Introvert ↔ Extrovert) ─────────
          <div className="mt-10 relative w-full max-w-xl mx-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Introvert</span>
              <span>Ambivert</span>
              <span>Extrovert</span>
            </div>

            {/* Track */}
            <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-500/70 relative">
              {/* Marker */}
              <div
                className="absolute -top-1.5 h-6 w-6 rounded-full bg-white shadow ring-2 ring-indigo-500 transition-all duration-700"
                style={{
                  left: `${pct}%`,
                  transform: "translateX(-50%)",
                }}
                aria-hidden
              />
            </div>

            <p className="mt-4 text-gray-700 font-medium">
              {pct < 40
                ? "You lean toward the introverted side."
                : pct > 60
                ? "You lean toward the extroverted side."
                : "You balance both — an ambivert by nature."}
            </p>
          </div>
        ) : (
          // ───────── Percentage Circle (bv. Sleep) ─────────
          <div className="mt-8 flex justify-center">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="#E5E7EB"
                strokeWidth="16"
                fill="none"
              />
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="#5B5FF0"
                strokeWidth="16"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
              />
              <text
                x="110"
                y="118"
                textAnchor="middle"
                fontSize="36"
                fontWeight="800"
                fill="#1F2937"
              >
                {pct}%
              </text>
            </svg>
          </div>
        )}

        {/* Share buttons */}
        <ResultShare url={shareUrl} pct={pct} slug={quiz.slug} />

        <div className="mt-8">
          <a
            href={`/quiz/${quiz.slug}`}
            className="text-sm text-blue-700 underline hover:no-underline"
          >
            Retake the quiz
          </a>
        </div>
      </section>

      {/* Editorial block with sources */}
      <ResultLearnMore
        title={lm.title}
        intro={lm.intro}
        tips={lm.tips}
        sources={lm.sources}
        disclaimer={lm.disclaimer}
      />
    </main>
  );
}
