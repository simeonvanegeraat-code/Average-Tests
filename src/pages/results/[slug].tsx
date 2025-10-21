// src/pages/results/[slug].tsx

import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useMemo } from "react";

// Kleine helper voor nette valuta
const fmt = (n: number) =>
  isFinite(n) ? new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n) : "–";

export default function ResultPage() {
  const { query } = useRouter();
  const q = query as {
    region?: string;
    age?: string;
    monthly_savings?: string;
    monthly_income?: string;
    current_savings_balance?: string;
    gross_wealth?: string;
    avg?: string;
    median?: string;
    delta?: string; // vs median (%)
    label?: string;
    savings_rate?: string; // %
    advice?: string;
  };

  // Validatie
  const hasBasics =
    q?.region &&
    q?.age &&
    q?.monthly_savings &&
    q?.avg &&
    q?.median &&
    q?.delta &&
    q?.label;

  if (!hasBasics) {
    return (
      <Layout title="Results">
        <div className="card">Invalid result data.</div>
      </Layout>
    );
  }

  // Getallen
  const region = q.region!;
  const age = Number(q.age);
  const monthlySavings = Number(q.monthly_savings);
  const monthlyIncome = Number(q.monthly_income ?? 0);
  const currentSavings = Number(q.current_savings_balance ?? 0);
  const grossWealth = Number(q.gross_wealth ?? 0);
  const avg = Number(q.avg);
  const median = Number(q.median);
  const delta = Number(q.delta); // in %
  const savingsRate = Number(q.savings_rate ?? 0);
  const label = q.label!;
  const advice = q.advice ?? "";

  // UI-afleiding
  const tone = useMemo(() => {
    if (label.toLowerCase().includes("above")) return "above";
    if (label.toLowerCase().includes("below")) return "below";
    return "around";
  }, [label]);

  const toneClasses =
    tone === "above"
      ? {
          ring: "ring-1 ring-green-400",
          chip: "bg-green-600/10 text-green-700 dark:text-green-300 dark:bg-green-500/20",
          bar: "bg-green-500",
          headline: "🏆 Great job!",
        }
      : tone === "below"
      ? {
          ring: "ring-1 ring-red-400",
          chip: "bg-red-600/10 text-red-700 dark:text-red-300 dark:bg-red-500/20",
          bar: "bg-red-500",
          headline: "💡 Room to improve",
        }
      : {
          ring: "ring-1 ring-yellow-400",
          chip: "bg-yellow-600/10 text-yellow-700 dark:text-yellow-300 dark:bg-yellow-500/20",
          bar: "bg-yellow-500",
          headline: "👌 You're on track",
        };

  // Balk-berekening: schaal t.o.v. het grootste van (you, median, avg), cap op 100%
  const barPct = useMemo(() => {
    const maxRef = Math.max(monthlySavings, median, avg, 1); // voorkom /0
    return Math.min(100, Math.round((monthlySavings / maxRef) * 100));
  }, [monthlySavings, median, avg]);

  return (
    <Layout title="Your Results">
      <div className="space-y-6">
        {/* HERO RESULT */}
        <div className={`card ${toneClasses.ring}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{toneClasses.headline}</h1>
              <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${toneClasses.chip}`}>
                {label}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">You save</div>
              <div className="text-2xl font-bold">
                {fmt(monthlySavings)} <span className="text-base font-medium text-gray-500">/ mo</span>
              </div>
              <div className="text-sm text-gray-500">≈ {isFinite(savingsRate) ? `${savingsRate}%` : "–"} of income</div>
            </div>
          </div>

          {/* Vergelijkingsbalk */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>You</span>
              <span>Median {fmt(median)}</span>
              <span>Average {fmt(avg)}</span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full ${toneClasses.bar}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              You are {delta > 0 ? `+${delta}%` : `${delta}%`} vs the median in{" "}
              <strong>{region}</strong>, age <strong>{age}</strong>.
            </div>
          </div>
        </div>

        {/* SNAPSHOT */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Your savings snapshot</h3>
            <ul className="text-sm space-y-1">
              <li>
                Monthly savings: <strong>{fmt(monthlySavings)}</strong>{" "}
                <span className="text-gray-500">({isFinite(savingsRate) ? `${savingsRate}%` : "–"} of income)</span>
              </li>
              <li>
                Current savings balance: <strong>{fmt(currentSavings)}</strong>
              </li>
              <li>
                Estimated gross wealth: <strong>{fmt(grossWealth)}</strong>
              </li>
            </ul>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Benchmark</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{region}</strong>, age <strong>{age}</strong>
            </p>
            <ul className="text-sm space-y-1 mt-2">
              <li>Average monthly savings: <strong>{fmt(avg)}</strong></li>
              <li>Median monthly savings: <strong>{fmt(median)}</strong></li>
            </ul>
          </div>
        </div>

        {/* ADVIES */}
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-2">Advice</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {advice || "Set a monthly savings target, review investments & wealth, and revisit in 6 months."}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-3">
          <a
            className="btn btn-primary"
            href={`/test/global-monthly-savings-plus-wealth`}
          >
            Try another input
          </a>
          <button
            className="btn border border-gray-300 dark:border-gray-700"
            onClick={() => {
              const text = `My savings: ${fmt(monthlySavings)} (~${savingsRate}% income). Median: ${fmt(median)}. ${label}.`;
              if (navigator.share) {
                navigator.share({
                  title: "Average Tests — Savings Result",
                  text,
                  url: typeof window !== "undefined" ? window.location.href : "",
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${text} ${window.location.href}`).then(
                  () => alert("Copied to clipboard"),
                  () => {}
                );
              }
            }}
          >
            Share result
          </button>
        </div>
      </div>
    </Layout>
  );
}
