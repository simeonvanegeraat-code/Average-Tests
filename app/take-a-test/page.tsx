// app/take-a-test/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { QUIZZES } from "@/lib/quizzes";

export const metadata: Metadata = {
  title: "Take a Test — HumanAverage",
  description:
    "Explore all HumanAverage quizzes. Quick, data-informed tests to discover how you compare.",
  alternates: { canonical: "https://www.humanaverage.com/take-a-test" },
  openGraph: {
    title: "Take a Test — HumanAverage",
    description:
      "Explore all HumanAverage quizzes. Quick, data-informed tests to discover how you compare.",
    url: "https://www.humanaverage.com/take-a-test",
    siteName: "HumanAverage",
    images: ["/og-default.png"],
    type: "website",
  },
};

export default function TakeATestPage() {
  return (
    <main className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Take a Test
        </h1>
        <p className="mt-3 text-gray-600">
          Browse all quizzes. Filter, sort, and find your next 2-minute test.
        </p>
      </header>

      {/* Client-only controls + list in één component */}
      <Catalog />
    </main>
  );
}

/* ---------- Client component voor filter/sort ---------- */
"use client";

import { useMemo, useState } from "react";

function Catalog() {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "recent">("alpha");

  const items = useMemo(() => {
    const normalized = q.trim().toLowerCase();
    let list = QUIZZES.filter(
      (x) =>
        !normalized ||
        x.title.toLowerCase().includes(normalized) ||
        x.description.toLowerCase().includes(normalized)
    );

    if (sortBy === "alpha") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // simpel heuristiek: later kun je publishedAt aan QuizMeta toevoegen
      list = [...list].reverse();
    }
    return list;
  }, [q, sortBy]);

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex-1">
          <label className="sr-only" htmlFor="search">Search tests</label>
          <input
            id="search"
            type="search"
            placeholder="Search by title or topic…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 md:gap-3">
          <label htmlFor="sort" className="sr-only">Sort</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="alpha">Sort: A → Z</option>
            <option value="recent">Sort: Most recent</option>
          </select>
          <Link
            href="/"
            className="hidden md:inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((x) => (
          <Link
            key={x.slug}
            href={`/quiz/${x.slug}`}
            className="group block rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition"
          >
            <img
              src={x.image || "/og-default.png"}
              alt={x.title}
              className="w-full aspect-[16/9] object-cover"
              loading="lazy"
            />
            <div className="p-4">
              <h2 className="font-semibold group-hover:underline">{x.title}</h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                {x.description}
              </p>
              <div className="mt-3 inline-flex items-center text-indigo-600 font-medium">
                Start test <span className="ml-1">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Lege staat */}
      {items.length === 0 && (
        <p className="text-center text-gray-500 py-10">No tests found.</p>
      )}
    </section>
  );
}
