// src/components/HighlightStats.tsx
type Stat = { id: string; label: string; value: string; sub?: string; emoji?: string };

export default function HighlightStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative">
      <h2 className="text-2xl font-bold mb-4">Highlight stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl p-5 shadow-sm hover:shadow-md transition-transform duration-300 ease-out hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
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
