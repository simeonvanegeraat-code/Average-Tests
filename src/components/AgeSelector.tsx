import { useRouter } from "next/router";
import { useMemo } from "react";

const AGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

export default function AgeSelector() {
  const router = useRouter();

  const selected = useMemo(
    () => (router.query.age as string) || "18-24",
    [router.query.age]
  );

  const setAge = (val: string) => {
    const q = {
      ...router.query,
      age: val,
      continent: (router.query.continent as string) || "Global",
    };
    router.replace({ pathname: router.pathname, query: q }, undefined, {
      shallow: true,
    });
  };

  return (
    <div className="w-full overflow-x-auto whitespace-nowrap -mx-2 px-2">
      <div className="inline-flex gap-2">
        {AGES.map((a) => {
          const active = a === selected;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setAge(a)}
              aria-pressed={active}
              className={[
                "h-10 px-4 rounded-full border text-sm transition",
                active
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50",
              ].join(" ")}
            >
              {a}
            </button>
          );
        })}
      </div>
    </div>
  );
}
