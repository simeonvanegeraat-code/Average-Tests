import { useRouter } from "next/router";
import { useMemo } from "react";

const CONTINENTS = [
  "Global",
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Africa",
  "Oceania",
];

export default function ContinentSelector() {
  const router = useRouter();

  const selected = useMemo(
    () => (router.query.continent as string) || "Global",
    [router.query.continent]
  );

  const setContinent = (val: string) => {
    const q = {
      ...router.query,
      continent: val,
      age: (router.query.age as string) || "18-24",
    };
    router.replace({ pathname: router.pathname, query: q }, undefined, {
      shallow: true,
    });
  };

  return (
    <div className="w-full overflow-x-auto whitespace-nowrap -mx-2 px-2">
      <div className="inline-flex gap-2">
        {CONTINENTS.map((c) => {
          const active = c === selected;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setContinent(c)}
              aria-pressed={active}
              className={[
                "h-10 px-4 rounded-full border text-sm transition",
                active
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50",
              ].join(" ")}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
