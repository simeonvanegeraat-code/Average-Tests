import { useMemo, useState } from "react";
import { useRouter } from "next/router";

const CONTINENTS = [
  "Global",
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Africa",
  "Oceania",
];

const AGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

function Chip({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active ? "true" : "false"}
      className={[
        "h-9 px-3 rounded-full border text-sm transition flex items-center gap-2",
        active
          ? "bg-white border-sky-300 shadow-sm"
          : "bg-white border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      <span className="font-medium text-gray-700">{label}:</span>
      <span className="text-gray-900">{value}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        className={[
          "transition-transform",
          active ? "rotate-180" : "rotate-0",
        ].join(" ")}
        aria-hidden="true"
      >
        <path
          d="M7 10l5 5 5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function FilterBar() {
  const router = useRouter();
  const continent = useMemo(
    () => (router.query.continent as string) || "Global",
    [router.query.continent]
  );
  const age = useMemo(
    () => (router.query.age as string) || "18-24",
    [router.query.age]
  );

  const [open, setOpen] = useState<null | "continent" | "age">(null);

  const setContinent = (val: string) => {
    const q = { ...router.query, continent: val, age };
    router.replace({ pathname: router.pathname, query: q }, undefined, {
      shallow: true,
    });
    setOpen(null);
  };

  const setAge = (val: string) => {
    const q = { ...router.query, age: val, continent };
    router.replace({ pathname: router.pathname, query: q }, undefined, {
      shallow: true,
    });
    setOpen(null);
  };

  return (
    <div className="card p-3 md:p-4">
      {/* Compact chips */}
      <div className="flex items-center gap-2">
        <Chip
          label="Continent"
          value={continent}
          active={open === "continent"}
          onClick={() => setOpen(open === "continent" ? null : "continent")}
        />
        <Chip
          label="Age"
          value={age}
          active={open === "age"}
          onClick={() => setOpen(open === "age" ? null : "age")}
        />
      </div>

      {/* Collapsible panels */}
      {open === "continent" && (
        <div className="mt-3 w-full overflow-x-auto -mx-2 px-2">
          <div className="inline-flex gap-2">
            {CONTINENTS.map((c) => {
              const active = c === continent;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setContinent(c)}
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
      )}

      {open === "age" && (
        <div className="mt-3 w-full overflow-x-auto -mx-2 px-2">
          <div className="inline-flex gap-2">
            {AGES.map((a) => {
              const active = a === age;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAge(a)}
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
      )}
    </div>
  );
}
