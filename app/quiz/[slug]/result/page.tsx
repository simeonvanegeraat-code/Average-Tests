// app/quiz/[slug]/result/page.tsx
import { getQuizDataBySlug, getQuizMetaBySlug } from "@/lib/quizzes";
import QuizResult from "@/components/QuizResult";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { score?: string; max?: string; pct?: string };
}) {
  const meta = getQuizMetaBySlug(params.slug);
  if (!meta) return {};
  const pct = Number(searchParams?.pct || 0);
  const title = `${meta.title} — ${pct}% • HumanAverage`;

  return {
    title,
    description: `I scored ${pct}% on ${meta.title}. How do you compare?`,
    alternates: {
      canonical: `https://www.humanaverage.com/quiz/${params.slug}/result`,
    },
    openGraph: {
      title,
      description: `Take the test and see how you compare.`,
      images: [meta.image || "/og-default.png"],
    },
  };
}

export default function ResultPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { score?: string; max?: string; pct?: string };
}) {
  const data = getQuizDataBySlug(params.slug);
  const meta = getQuizMetaBySlug(params.slug);
  if (!data || !meta) return <main><p>Quiz not found.</p></main>;

  const score = Number(searchParams.score || 0);
  const max = Number(searchParams.max || meta.maxScore);
  const percent = Math.max(0, Math.min(100, Math.round((score / max) * 100)));

  const { label, summary } = data.interpret(percent);
  const shareUrl = `https://www.humanaverage.com/quiz/${data.slug}/result?score=${score}&max=${max}&pct=${percent}`;

  return (
    <main className="space-y-8 max-w-3xl mx-auto">
      <header className="text-center space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold">{data.title}</h1>
        <p className="text-gray-600">Your personalized result</p>
      </header>

      <QuizResult
        percent={percent}
        title={data.title}
        label={label}
        summary={summary}
        shareUrl={shareUrl}
      />

      <div className="text-center">
        <a
          href={`/quiz/${data.slug}`}
          className="inline-block mt-4 text-indigo-700 font-medium hover:underline"
        >
          Retake the quiz
        </a>
      </div>
    </main>
  );
}
