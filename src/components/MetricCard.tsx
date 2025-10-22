// src/components/MetricCard.tsx
type Props = {
  emoji?: string;
  title: string;
  unit: string;
  mean: number | null;
  median: number | null;
  year?: string;
  source?: { name?: string; url?: string };
  note?: string;
};

const formatVal = (n: number | null, unit: string) => {
  if (n === null || !Number.isFinite(n)) return "N/A";
  if (unit === "€" || unit.startsWith("€")) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  }
  if (unit === "%") return `${n}%`;
  return `${n} ${unit}`;
};

export default function MetricCard({
  emoji = "📊",
  title,
  unit,
  mean,
  median,
  year,
  source,
  note,
}: Props) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-5 relative overflow-hidden">
      {/* subtle corner gradient accent */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-cyan-400/10 to-sky-400/10" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{emoji}</span>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="p-4 rounded-2xl bg-emerald-50">
            <div className="text-xs text-gray-500">Mean</div>
            <div className="text-xl font-bold">{formatVal(mean, unit)}</div>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-50">
            <div className="text-xs text-gray-500">Median</div>
            <div className="text-xl font-bold">{formatVal(median, unit)}</div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-600">
          {year ? <span className="mr-2">Year: {year}</span> : null}
          {source?.name ? (
            <a
              className="underline underline-offset-2 hover:text-sky-700"
              target="_blank"
              rel="noopener noreferrer"
              href={source.url || "#"}
            >
              Source: {source.name}
            </a>
          ) : (
            <span>Source to be added</span>
          )}
          {note ? <div className="mt-1 italic">{note}</div> : null}
        </div>
      </div>
    </article>
  );
}
