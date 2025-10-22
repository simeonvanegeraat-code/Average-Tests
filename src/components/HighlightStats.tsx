type Stat = { id: string; label: string; value: string; sub?: string; emoji?: string };

export default function HighlightStats({ stats }: { stats: Stat[] }) {
  return (
    <section aria-labelledby="highlight-stats">
      <h2 id="highlight-stats" className="text-2xl font-bold mb-4">Highlight stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.id}
            className="card p-5 bg-white/90 hover:bg-white transition-transform duration-300 ease-out hover:-translate-y-0.5"
            style={{ opacity: 0, transform: "translateY(8px)", animation: `fadeUp .5s ease-out ${0.05 * i}s forwards` }}
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <span className="text-xl">{s.emoji ?? "📊"}</span>
              <span>{s.label}</span>
            </div>
            <div className="text-2xl font-extrabold tracking-tight">{s.value}</div>
            {s.sub ? <div className="text-xs text-gray-500 mt-1">{s.sub}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
