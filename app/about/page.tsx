export const metadata = {
  title: "About — HumanAverage",
  description: "Who we are and why we built this."
};

export default function AboutPage() {
  return (
    <article className="space-y-4">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>About</h1>
      <p>HumanAverage explores how we compare — through quizzes, polls and data-light stories. We aim for enjoyable, people-first content.</p>
      <p>We avoid heavy claims and cite sources when facts are used. If you see an issue, reach us on the Contact page.</p>
    </article>
  );
}
