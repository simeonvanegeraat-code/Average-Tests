// src/components/CategoryPage.tsx
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import ContinentSelector from "@/components/ContinentSelector";
import AgeSelector from "@/components/AgeSelector";

type StatItem = {
  id: string;
  title: string;
  metric: string;
  unit: string;
  value_mean: number | null;
  value_median: number | null;
  year?: string;
  source?: { name?: string; url?: string };
  note?: string;
  continent?: string;
  age?: string;
};

type Props = {
  title: string;
  subtitle: string;
  emoji: string;
  stats: StatItem[];
  intro?: React.ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
};

const EMOJI_BY_ID: Record<string, string> = {
  monthly_savings: "💶",
  savings_rate: "📈",
  savings_balance: "🏦",
  net_wealth: "💰",
  debt_total: "💳",
  annual_return: "📊",
  starter_capital: "🌱",
  no_savings_share: "⚠️",
  // habits
  morning_person: "🌅",
  books_per_year: "📚",
  restaurant_meals: "🍽️",
  coffee_per_day: "☕",
  drinks_per_week: "🍷"
};

const fmt = (n: number | null, unit: string) => {
  if (n === null || !Number.isFinite(n)) return "N/A";
  if (unit === "€" || unit.startsWith("€")) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(n);
  }
  if (unit === "%") return `${n}%`;
  return unit ? `${n} ${unit}` : String(n);
};

export default function CategoryPage({
  title,
  subtitle,
  emoji,
  stats,
  intro,
  ctaHref,
  ctaLabel = "Take the test"
}: Props) {
  const router = useRouter();
  const continent = (router.query.continent as string) || "Global";
  const age = (router.query.age as string) || "18-24";

  // Defaults in URL houden
  useEffect(() => {
    if (!router.isReady) return;
    const needs = !router.query.continent || !router.query.age;
    if (needs) {
      router.replace(
        { pathname: router.pathname, query: { ...router.query, continent, age } },
        undefined,
        { shallow: true }
      );
    }
  }, [router.isReady, router.query, router, continent, age]);

  const filtered = useMemo(() => {
    const rows = stats.filter((s) => {
      const okContinent =
        continent === "Global" ? (s.continent ?? "Global") === "Global" : s.continent === continent;
      const okAge = s.age ? s.age === age : true;
      return okContinent && okAge;
    });
    return rows;
  }, [stats, continent, age]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="card p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl md:text-4xl">{emoji}</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
      </header>

      {/* Sticky filterbar */}
      <div className="sticky top-14 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="container py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                <span>🌍</span> Continent
              </span>
              <ContinentSelector />
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                <span>👤</span> Age
              </span>
              <AgeSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Intro */}
      {intro ? <section className="card p-6 bg-white/90">{intro}</section> : null}

      {/* Stat grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="card p-6 col-span-full">
              No data yet for <strong>{continent}</strong> · <strong>{age}</strong>.
            </div>
          ) : (
            filtered.map((s, i) => (
              <article
                key={`${s.id}-${s.continent || "global"}-${s.age || "all"}-${i}`}
                className="rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-5 relative overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-cyan-400/10 to-sky-400/10" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{EMOJI_BY_ID[s.id] ?? "📊"}</span>
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                  </div>

                  <p className="text-xs text-gray-500">
                    {s.continent ?? "Global"}
                    {s.age ? ` · ${s.age}` : ""}
                    {s.year ? ` · ${s.year}` : ""}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-emerald-50">
                      <div className="text-xs text-gray-500">Mean</div>
                      <div className="text-xl font-bold">{fmt(s.value_mean, s.unit)}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-cyan-50">
                      <div className="text-xs text-gray-500">Median</div>
                      <div className="text-xl font-bold">{fmt(s.value_median, s.unit)}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    {s.source?.name ? (
                      <a
                        className="underline underline-offset-2 hover:text-sky-700"
                        href={s.source.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source: {s.source.name}
                      </a>
                    ) : (
                      <span>Source</span>
                    )}
                    {s.note ? <div className="mt-1 italic">{s.note}</div> : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* CTA (optioneel) */}
      {ctaHref ? (
        <section className="card p-6 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold">Compare yourself</h4>
            <p className="text-sm text-gray-600">
              Ready for a personal check? Enter your numbers and see how you compare within your region and age group.
            </p>
          </div>
          <a
            href={ctaHref}
            className="h-10 inline-flex items-center px-5 rounded-full bg-sky-600 text-white hover:bg-sky-700"
          >
            {ctaLabel}
          </a>
        </section>
      ) : null}
    </div>
  );
}
