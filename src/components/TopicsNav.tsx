"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";

/**
 * Centrale mapping van categorieën -> slug, label, emoji.
 * Voeg hier eenvoudig nieuwe categories toe of verander de volgorde.
 */
export const CATEGORIES: Array<{ slug: string; label: string; emoji: string }> = [
  { slug: "money",  label: "Money & Savings",      emoji: "💰" },
  { slug: "income", label: "Income & Work",        emoji: "💼" },
  { slug: "debt",   label: "Debt & Spending",      emoji: "💳" },
  { slug: "habits", label: "Habits & Daily Life",  emoji: "🧭" },
  { slug: "health", label: "Health & Fitness",     emoji: "🏃‍♂️" },
  { slug: "housing",label: "Housing & Living",     emoji: "🏠" },
  { slug: "education", label: "Education & Skills",emoji: "🎓" },
  { slug: "tech",   label: "Tech & Time Online",   emoji: "💻" },
];

type Props = {
  /** Toon de tabbar compact (onder de hoofdheader). */
  compact?: boolean;
  /** Als true: alleen renderen op /category/[slug]. */
  onlyOnCategoryPages?: boolean;
};

/**
 * Horizontale, scrollbare tabbar met alle hoofdtopics.
 * Op category-pagina's bewaren we continent & age in de links.
 */
export default function TopicsNav({ compact = true, onlyOnCategoryPages = false }: Props) {
  const router = useRouter();

  const isOnCategory = router.pathname.startsWith("/category/");
  if (onlyOnCategoryPages && !isOnCategory) return null;

  // Active slug bepalen
  const activeSlug = useMemo(() => {
    if (!isOnCategory) return null;
    // /category/[slug]
    const qslug = router.query.slug;
    if (typeof qslug === "string") return qslug;
    if (Array.isArray(qslug)) return qslug[0];
    return null;
  }, [router.pathname, router.query, isOnCategory]);

  // Bestaande filters meenemen (continent & age) bij navigatie
  const preserveFilters = useMemo(() => {
    const continent = typeof router.query.continent === "string" ? router.query.continent : undefined;
    const age = typeof router.query.age === "string" ? router.query.age : undefined;
    return { continent, age };
  }, [router.query.continent, router.query.age]);

  return (
    <nav
      aria-label="Topics"
      className={[
        "w-full",
        compact ? "" : "mt-2",
      ].join(" ")}
    >
      <div
        className={[
          "relative",
          "border border-gray-200 bg-white rounded-2xl",
          "px-2 py-2",
          "overflow-x-auto no-scrollbar",
        ].join(" ")}
      >
        <ul className="flex items-center gap-1 min-w-max">
          {CATEGORIES.map(({ slug, label, emoji }) => {
            const isActive = activeSlug === slug;
            const href = {
              pathname: "/category/[slug]",
              query: { slug, ...(preserveFilters.continent ? { continent: preserveFilters.continent } : {}), ...(preserveFilters.age ? { age: preserveFilters.age } : {}) },
            };

            return (
              <li key={slug}>
                <Link
                  href={href}
                  className={[
                    "inline-flex items-center gap-2 h-9 px-3 rounded-full border transition",
                    "whitespace-nowrap text-sm",
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
    </nav>
  );
}
