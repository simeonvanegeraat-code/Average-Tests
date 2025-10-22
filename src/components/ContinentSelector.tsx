import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const CONTINENTS = [
  "Global",
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Africa",
  "Oceania",
] as const;

type Continent = typeof CONTINENTS[number];

export default function ContinentSelector() {
  const router = useRouter();
  const q = router.query as { continent?: string };
  const initial = (q?.continent as Continent) || "Global";
  const [value, setValue] = useState<Continent>(initial);

  useEffect(() => {
    if (!router.isReady) return;
    const current = (router.query.continent as Continent) || "Global";
    setValue(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const onSelect = (c: Continent) => {
    setValue(c);
    const url = { pathname: router.pathname, query: { ...router.query, continent: c } };
    router.replace(url, undefined, { shallow: true });
  };

  const Btn = useMemo(
    () =>
      function Btn({ label }: { label: Continent }) {
        const active = value === label;
        return (
          <button
            type="button"
            onClick={() => onSelect(label)}
            className={[
              "h-9 px-3 rounded-full border text-sm transition",
              active
                ? "bg-sky-600 text-white border-sky-600"
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
      {CONTINENTS.map((c) => (
        <Btn key={c} label={c} />
      ))}
    </div>
  );
}
