// app/quiz/[slug]/page.tsx
import { getQuizDataBySlug } from "@/lib/quizzes";
import QuizClient from "./quiz-client";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = getQuizDataBySlug(params.slug);
  if (!data) return {};
  return {
    title: `${data.title} • HumanAverage`,
    description: data.description,
    alternates: { canonical: `https://www.humanaverage.com/quiz/${data.slug}` },
    openGraph: {
      title: data.title,
      description: data.description,
      images: [data.image || "/og-default.png"],
    },
  };
}

export default function QuizPage({ params }: { params: { slug: string } }) {
  const data = getQuizDataBySlug(params.slug);
  if (!data) return <main><p>Quiz not found.</p></main>;

  return (
    <main className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold">{data.title}</h1>
        <p className="text-gray-600">{data.description}</p>
      </header>
      <QuizClient slug={data.slug} />
    </main>
  );
}
