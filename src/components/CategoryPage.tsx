"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import StickyFilterBar from "@/components/StickyFilterBar";
import QuickStatsRow from "@/components/QuickStatsRow";

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

export default function CategoryPage({
  title,
  subtitle,
  emoji,
  stats,
  intro,
  ctaHref,
  ctaLabel = "Take the test",
}: Props) {
  const router = useRouter();
  const continent = (router.query.continent as string) || "Global";
  const age = (router.query.age as string) || "18-24";

  // Default query voor shareable links
  useEffect(() => {
    if (!router.isReady) return;
    if (!router.query.continent || !router.query.age) {
      router.replace(
        { pathname: router.pathname, query: { ...router.query, continent, age } },
        undefined,
        { shallow: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const filtered = useMemo(() => {
    const rows = stats.filter((s) => {
      const okContinent =
        continent === "Global" ? (s.continent ?? "Global") === "Global" : s.continent === continent;
      const okAge = s.age ? s.age === age : true;
      return okContinent && okAge;
    });

    // volgorde: eerst een vaste basismatrix, daarna alfabetisch
    const order = [
      "monthly_savings",
      "savings_rate",
      "savings_balance",
      "net_wealth",
      "debt_total",
      "annual_return",
      "starter_capital",
      "no_savings_share",
      "annual_salary",
      "hours_worked",
      "books_per_year",
      "morning_person_share",
      "restaurant_meals_per_week",
    ];
    return rows.sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.title.localeCompare(b.title);
    });
  }, [stats, continent, age]);

  const isDemo =
    filtered.length > 0 &&
    filtered.every((x) => {
      const n = (x.source?.name || "").toLowerCase();
      return n.includes("aggregated") || n.includes("demo");
    });

  // Split: 3 snelle KPI’s + rest
  const quick = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="space-y-6">
      {/* Compact hero */}
      <header className="card p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl md:text-4xl">{emoji}</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
          </div>
          {isDemo && (
            <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
              ⏳ Demo data
            </span>
          )}
        </div>

        {/* Sticky, compacte filterbalk */}
        <div className="mt-3">
          <StickyFilterBar />
        </div>
      </header>

      {/* Quick stats direct boven de vouw */}
      {quick.length ? <QuickStatsRow items={quick} /> : null}

      {/* Intro / methodiek (inklapbaar kun je later toevoegen) */}
      {intro ? <section className="card p-6 bg-white/90">{intro}</section> : null}

      {/* Overige kaarten */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {rest.length === 0 ? (
            <div className="card p-6 col-span-full">
              Geen gegevens voor <strong>{continent}</strong> · <strong>{age}</strong>. Pas je filters aan.
            </div>
          ) : (
            rest.map((s, i) => (
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
                    {s.age ? ` · ${s.age}` : ""} {s.year ? `· ${s.year}` : ""}
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
                      <span>Source to be added</span>
                    )}
                    {s.note ? <div className="mt-1 italic">{s.note}</div> : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* CTA onderaan (licht) */}
      {ctaHref ? (
        <section className="card p-6 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold">Compare yourself</h4>
            <p className="text-sm text-gray-600">
              Enter your numbers and see how you compare within your region and age group.
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
