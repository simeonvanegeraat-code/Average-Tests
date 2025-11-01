export const metadata = {
  title: "Editorial Policy — HumanAverage",
  description: "Our approach to accuracy, transparency, and helpful content."
};

export default function EditorialPage() {
  return (
    <article className="space-y-4">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Editorial Policy</h1>
      <ul className="space-y-2">
        <li><strong>People-first:</strong> Content should be enjoyable, clear, and honest.</li>
        <li><strong>Accuracy:</strong> When we use facts, we cite reputable sources and update when needed.</li>
        <li><strong>Transparency:</strong> Quizzes are for entertainment and self-reflection, not medical or financial advice.</li>
        <li><strong>Corrections:</strong> We fix mistakes quickly (see Corrections page).</li>
        <li><strong>Ads:</strong> Advertising will never alter quiz outcomes or editorial choices.</li>
      </ul>
    </article>
  );
}
