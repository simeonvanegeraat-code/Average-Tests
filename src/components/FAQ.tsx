// src/components/FAQ.tsx
type QA = { q: string; a: string };

export default function FAQ({ items, title = "Money & Savings — FAQ" }: { items: QA[]; title?: string }) {
  return (
    <section className="card p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((it, i) => (
          <details key={i} className="group rounded-2xl border border-gray-200 bg-white p-4 open:bg-gray-50">
            <summary className="cursor-pointer list-none font-medium">
              <span className="mr-2">💬</span>{it.q}
            </summary>
            <div className="mt-2 text-gray-700">{it.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
