// src/components/CategoryPage.tsx
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
  intro?: React.ReactNode; // SEO-intro blok
  ctaHref?: string;        // link naar test
  ctaLabel?: string;
};

const fmt = (n: number | null, unit: string) => {
  if (n === null || !isFinite(n)) return "N/A";
  if (unit.startsWith("€")) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  }
  // simpele units achter toevoegen
  return `${n} ${unit}`;
};

export default function CategoryPage({
  title,
  subtitle,
  emoji,
  stats,
  intro,
  ctaHref,
  ctaLabel = "Take the savings test",
}: Props) {
  return (
    <div className="space-y-8">
      {/* HERO */}
      <header className="card p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl md:text-4xl">{emoji}</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
      </header>

      {/* SEO INTRO BLOK */}
      {intro ? (
        <section className="card p-6 bg-white/90">
          {intro}
        </section>
      ) : null}

      {/* STAT CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stats.map((s) => (
          <article key={s.id} className="card p-5">
            <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
            <p className="text-xs text-gray-500">
              {s.geo} · {s.age} · {s.year}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50">
                <div className="text-xs text-gray-500">Mean</div>
                <div className="text-xl font-bold">{fmt(s.value_mean, s.unit)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-cyan-50">
                <div className="text-xs text-gray-500">Median</div>
                <div className="text-xl font-bold">{fmt(s.value_median, s.unit)}</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600">
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

      {/* CTA NA ONDEREN */}
      {ctaHref ? (
        <section className="card p-6 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold">Compare yourself</h4>
            <p className="text-sm text-gray-600">
              Ready for a personal check? Enter your numbers and see how you compare with your age group and region.
            </p>
          </div>
          <a href={ctaHref} className="btn btn-primary h-10 inline-flex items-center px-5 rounded-full bg-sky-600 text-white hover:bg-sky-700">
            {ctaLabel}
          </a>
        </section>
      ) : null}
    </div>
  );
}
