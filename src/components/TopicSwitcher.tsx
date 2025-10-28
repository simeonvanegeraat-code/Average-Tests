// src/components/TopicSwitcher.tsx
import { useRouter } from "next/router";
import Link from "next/link";
import { useMemo, useState } from "react";

const TOPICS = [
  { slug: "money",  emoji: "💰", label: "Money & Savings" },
  { slug: "income", emoji: "💼", label: "Income & Work" },
  { slug: "debt",   emoji: "🧾", label: "Debt & Spending" },
  { slug: "life",   emoji: "💟", label: "Lifestyle & Relationships" },
  { slug: "health", emoji: "🏋️", label: "Health & Fitness" },
  { slug: "tech",   emoji: "📱", label: "Technology & Screen Time" },
  { slug: "focus",  emoji: "⚡", label: "Productivity & Focus" },
  { slug: "habits", emoji: "☕", label: "Habits & Daily Life" }
];

export default function TopicSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const q = useMemo(() => {
    const continent = (router.query.continent as string) || "Global";
    const age = (router.query.age as string) || "18-24";
    return `?continent=${encodeURIComponent(continent)}&age=${encodeURIComponent(age)}`;
  }, [router.query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-4 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium"
        aria-expanded={open}
        aria-controls="topic-switcher"
      >
        Browse topics
      </button>

      {open && (
        <div
          id="topic-switcher"
          className="absolute right-0 mt-2 w-[22rem] rounded-2xl border border-gray-200 bg-white shadow-lg p-3 grid grid-cols-2 gap-2 z-30"
        >
          {TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/category/${t.slug}${q}`}
              className="rounded-xl border border-gray-200 hover:border-sky-300 hover:bg-sky-50/50 p-3 flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="text-sm font-medium">{t.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
