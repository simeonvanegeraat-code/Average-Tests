// src/components/AgeSelector.tsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const AGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
type Age = typeof AGES[number];

export default function AgeSelector() {
  const router = useRouter();
  const q = router.query as { age?: string };
  const initial = (q?.age as Age) || "18-24";
  const [value, setValue] = useState<Age>(initial);

  useEffect(() => {
    if (!router.isReady) return;
    const cur = (router.query.age as Age) || "18-24";
    setValue(cur);
  }, [router.isReady, router.query.age]);

  const onSelect = (a: Age) => {
    setValue(a);
    const url = { pathname: router.pathname, query: { ...router.query, age: a } };
    router.replace(url, undefined, { shallow: true });
  };

  const Btn = useMemo(
    () =>
      function Btn({ label }: { label: Age }) {
        const active = value === label;
        return (
          <button
            type="button"
            onClick={() => onSelect(label)}
            className={[
              "h-9 px-3 rounded-full border text-sm transition",
              active
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700",
            ].join(" ")}
            aria-pressed={active}
          >
            {label}
          </button>
        );
      },
    [value]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {AGES.map((a) => (
        <Btn key={a} label={a} />
      ))}
    </div>
  );
}
