import { getQuiz } from '@/lib/quizzes';
import QuizClient from '@/components/QuizClient';

export default function QuizPage({ params }: { params: { slug: string } }) {
  const quiz = getQuiz(params.slug);
  if (!quiz) return <p>Quiz not found.</p>;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <p className="text-gray-600">{quiz.description}</p>
      </header>
      <QuizClient quiz={quiz} />
    </article>
  );
}
