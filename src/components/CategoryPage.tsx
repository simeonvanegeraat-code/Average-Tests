type StatItem = {
  id: string;
  title: string;
  metric: string;
  unit: string;
  value_mean: number | null;
  value_median: number | null;
  geo: string;
  age: string;
  year: string;
  source: { name: string; url: string };
  note?: string;
};

type Props = {
  title: string;
  subtitle: string;
  emoji: string;
  stats: StatItem[];
};

const fmt = (n: number | null, unit: string) => {
  if (n === null || !isFinite(n)) return "N/A";
  if (unit.startsWith("€")) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  }
  return `${n} ${unit}`;
};

export default function CategoryPage({ title, subtitle, emoji, stats }: Props) {
  return (
    <div className="space-y-6">
      <header className="card bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{emoji}</div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stats.map((s) => (
          <article key={s.id} className="card">
            <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
            <p className="text-xs text-gray-500">{s.geo} · {s.age} · {s.year}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-xs text-gray-500">Mean</div>
                <div className="text-xl font-bold">{fmt(s.value_mean, s.unit)}</div>
              </div>
              <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                <div className="text-xs text-gray-500">Median</div>
                <div className="text-xl font-bold">{fmt(s.value_median, s.unit)}</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
              {s.source?.name ? (
                <a className="link" href={s.source.url || "#"} target="_blank" rel="noopener noreferrer">
                  Source: {s.source.name}
                </a>
              ) : (
                <span>Source to be added</span>
              )}
              {s.note ? <div className="mt-1 italic">{s.note}</div> : null}
            </div>
          </article>
        ))}
      </section>

      <aside className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold mb-1">Compare yourself</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Ready for a personal check? Try a quick test that compares your input with your peers.
        </p>
        <div className="mt-3">
          <a href="/test/global-monthly-savings-plus-wealth" className="btn btn-primary">Take the savings test</a>
        </div>
      </aside>
    </div>
  );
}
