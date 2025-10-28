type StatItem = {
  id: string;
  title: string;
  metric: string;
  unit: string;
  value_mean: number | null;
  value_median: number | null;
  year?: string;
  source?: { name?: string; url?: string };
  continent?: string;
  age?: string;
};

const ORDER_PRIORITY = [
  // voorkeursvolgorde; als een id ontbreekt pakken we de eerstvolgende
  "monthly_savings",
  "savings_rate",
  "savings_balance",
  "annual_salary",
  "hours_worked",
  "books_per_year",
  "morning_person_share",
  "restaurant_meals_per_week",
];

const EMOJI_BY_ID: Record<string, string> = {
  monthly_savings: "💶",
  savings_rate: "📈",
  savings_balance: "🏦",
  annual_salary: "💼",
  hours_worked: "⏱️",
  books_per_year: "📚",
  morning_person_share: "🌅",
  restaurant_meals_per_week: "🍽️",
};

function fmt(n: number | null, unit: string) {
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
}

export default function QuickStatsRow({ items }: { items: StatItem[] }) {
  // Kies max 3 items op basis van prioriteit
  const picked: StatItem[] = [];
  for (const key of ORDER_PRIORITY) {
    const hit = items.find((x) => x.id === key);
    if (hit) picked.push(hit);
    if (picked.length === 3) break;
  }
  // fallback als er geen prioriteiten matchen
  while (picked.length < 3 && items[picked.length]) picked.push(items[picked.length]);

  if (!picked.length) return null;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {picked.map((s, i) => (
        <article
          key={`${s.id}-${i}`}
          className="rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-5 relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-cyan-400/10 to-sky-400/10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{EMOJI_BY_ID[s.id] ?? "📊"}</span>
                <h3 className="font-semibold">{s.title.replace(/\s*\(\d.+\)$/, "")}</h3>
              </div>
              {s.year ? <span className="text-xs text-gray-500">{s.year}</span> : null}
            </div>
            <p className="text-xs text-gray-500">
              {s.continent ?? "Global"} {s.age ? `· ${s.age}` : ""}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50">
                <div className="text-xs text-gray-500">Mean</div>
                <div className="text-lg font-bold">{fmt(s.value_mean, s.unit)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-cyan-50">
                <div className="text-xs text-gray-500">Median</div>
                <div className="text-lg font-bold">{fmt(s.value_median, s.unit)}</div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
