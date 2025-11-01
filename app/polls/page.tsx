export const metadata = {
  title: "Polls — HumanAverage",
  description: "Tiny social experiments about everyday choices."
};

const starterPolls = [
  { q: "Would you take a 4-day workweek for 10% less pay?", yes: 0.0 },
  { q: "Are you happier than 3 years ago?", yes: 0.0 },
  { q: "Do you trust AI assistants for daily tasks?", yes: 0.0 }
];

export default function PollsPage() {
  return (
    <section className="space-y-6">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Polls</h1>
      <p style={{ opacity: 0.85 }}>Tiny social experiments. Realtime storage can be enabled with Supabase later.</p>
      <div className="space-y-4">
        {starterPolls.map((p, i) => (
          <article key={i} className="border rounded p-4">
            <p style={{ fontWeight: 600 }}>{p.q}</p>
            <p style={{ opacity: 0.75, marginTop: 8 }}>Votes coming soon.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
