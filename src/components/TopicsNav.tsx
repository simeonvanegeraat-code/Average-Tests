"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Definitieve categorieën – exact zoals je tiles op Home:
 * 1) Money & Savings
 * 2) Income & Work
 * 3) Debt & Spending
 * 4) Lifestyle & Relationships
 * 5) Health & Fitness
 * 6) Technology & Screen Time
 * 7) Productivity & Focus
 * 8) Habits & Daily Life
 */
export const CATEGORIES: Array<{ slug: string; label: string; emoji: string }> = [
  { slug: "money",        label: "Money & Savings",            emoji: "💰" },
  { slug: "income",       label: "Income & Work",              emoji: "💼" },
  { slug: "debt",         label: "Debt & Spending",            emoji: "🧾" },
  { slug: "lifestyle",    label: "Lifestyle & Relationships",  emoji: "💖" },
  { slug: "health",       label: "Health & Fitness",           emoji: "🏋️" },
  { slug: "tech",         label: "Technology & Screen Time",   emoji: "📱" },
  { slug: "productivity", label: "Productivity & Focus",       emoji: "⚡" },
  { slug: "habits",       label: "Habits & Daily Life",        emoji: "☕" },
];

type Props = {
  /** Als true: render alleen op /category/*  */
  onlyOnCategoryPages?: boolean;
  /** Start open of dicht (standaard: dicht) */
  defaultOpen?: boolean;
};

/**
 * Collapsible Topics Navigator
 * - Default ingeklapt, met "Browse topics" toggle
 * - On category pages highlighten we de actieve tab
 * - We bewaren continent/age query params bij navigatie
 */
export default function TopicsNav({ onlyOnCategoryPages = false, defaultOpen = false }: Props) {
  const router = useRouter();
  const onCategory = router.pathname.startsWith("/category/");
  if (onlyOnCategoryPages && !onCategory) return null;

  // Active slug bepalen
  const activeSlug = useMemo(() => {
    if (!onCategory) return null;
    const qslug = router.query.slug;
    if (typeof qslug === "string") return qslug;
    if (Array.isArray(qslug)) return qslug[0];
    return null;
  }, [onCategory, router.query.slug]);

  // Filters meenemen
  const preserve = useMemo(() => {
    const continent = typeof router.query.continent === "string" ? router.query.continent : undefined;
    const age = typeof router.query.age === "string" ? router.query.age : undefined;
    return { continent, age };
  }, [router.query.continent, router.query.age]);

  // Collapsible state (bewaar in sessionStorage zodat UX consistent voelt)
  const [open, setOpen] = useState<boolean>(defaultOpen);
  useEffect(() => {
    const saved = sessionStorage.getItem("ha:topicsOpen");
    if (saved === "1") setOpen(true);
    if (saved === "0") setOpen(false);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("ha:topicsOpen", open ? "1" : "0");
  }, [open]);

  return (
    <div className="w-full">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-sm"
          aria-expanded={open}
          aria-controls="topics-panel"
        >
          <span>Browse topics</span>
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
          </svg>
        </button>
      </div>

      {/* Collapsible panel */}
      <div
        id="topics-panel"
        className={`mt-2 overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-[240px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border border-gray-200 bg-white rounded-2xl px-2 py-2">
          <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-max">
            {CATEGORIES.map(({ slug, label, emoji }) => {
              const isActive = activeSlug === slug;
              const href = {
                pathname: "/category/[slug]",
                query: {
                  slug,
                  ...(preserve.continent ? { continent: preserve.continent } : {}),
                  ...(preserve.age ? { age: preserve.age } : {}),
                },
              };
              return (
                <li key={slug}>
                  <Link
                    href={href}
                    className={[
                      "inline-flex items-center gap-2 h-9 px-3 rounded-full border whitespace-nowrap text-sm transition",
                      isActive
                        ? "bg-sky-600 text-white border-sky-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
