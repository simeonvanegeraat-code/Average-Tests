// scripts/build-money-json.ts
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

type Row = Record<string, string>;

const RAW = path.join(process.cwd(), "data", "raw");
const OUT = path.join(process.cwd(), "src", "data", "averages", "money.json");

// Define which continents and age groups we’ll process
const CONTINENTS = [
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Africa",
  "Oceania",
] as const;
const AGE_GROUPS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

type Continent = typeof CONTINENTS[number];
type Age = typeof AGE_GROUPS[number];

const N = (v?: string | number | null): number | null => {
  if (v === undefined || v === null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d\.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

function loadCSV(file: string) {
  const p = path.join(RAW, file);
  if (!fs.existsSync(p)) throw new Error(`Missing raw file: ${file}`);
  const raw = fs.readFileSync(p, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true }) as Row[];
}

/**
 * CSV formats expected:
 *
 * saving_rate_by_continent.csv
 *   continent,age,year,saving_rate_pct
 *
 * median_income_by_continent.csv
 *   continent,age,year,median_income_eur_year
 *
 * wealth_by_continent.csv
 *   continent,age,year,net_wealth_mean_eur,net_wealth_median_eur
 */

function build() {
  const srRows = loadCSV("saving_rate_by_continent.csv");
  const incRows = loadCSV("median_income_by_continent.csv");
  const wlRows = loadCSV("wealth_by_continent.csv");

  const pick = (rows: Row[], continent: string, age: string) =>
    rows.find((r) => r.continent === continent && r.age === age);

  const items: any[] = [];

  // ---- Derived monthly savings for each continent × age group ----
  CONTINENTS.forEach((c) => {
    AGE_GROUPS.forEach((a) => {
      const SR = pick(srRows, c, a);
      const INC = pick(incRows, c, a);
      if (!SR && !INC) return; // skip empty combination

      const sr = SR ? N(SR.saving_rate_pct) : null;
      const incYear = INC ? N(INC.median_income_eur_year) : null;
      const incMonth = incYear ? incYear / 12 : null;
      const monthly = sr && incMonth ? Math.round((sr / 100) * incMonth) : null;
      const year = SR?.year || INC?.year || "2024";

      items.push({
        id: "monthly_savings",
        title: `Average monthly savings (${a})`,
        metric: "monthly_savings_eur",
        unit: "€",
        value_mean: monthly,
        value_median: monthly,
        continent: c,
        age: a,
        year,
        source: {
          name: c === "Europe" ? "Eurostat (derived)" : "World Bank / national stats (derived)",
          url: ""
        },
        note: "Derived from saving rate × median disposable income per capita."
      });
    });
  });

  // ---- Net wealth per continent × broad age categories ----
  CONTINENTS.forEach((c) => {
    const WLAll = wlRows.filter((r) => r.continent === c);
    if (!WLAll.length) return;

    WLAll.forEach((r) => {
      const mean = N(r.net_wealth_mean_eur);
      const median = N(r.net_wealth_median_eur);
      const age = r.age || "All";
      const year = r.year || "2023";

      items.push({
        id: "net_wealth",
        title: `Average net household wealth (${age})`,
        metric: "net_wealth_eur",
        unit: "€",
        value_mean: mean,
        value_median: median,
        continent: c,
        age,
        year,
        source: {
          name: c === "Europe" ? "ECB HFCS" : "Credit Suisse Global Wealth / national stats",
          url: ""
        },
        note: "Median is typically lower due to inequality."
      });
    });
  });

  // ---- Derive global averages (simple mean across continents per age) ----
  function globalize(metricId: string) {
    AGE_GROUPS.forEach((a) => {
      const byMetric = items.filter((x) => x.id === metricId && x.age === a);
      if (!byMetric.length) return;
      const valsMean = byMetric.map((x) => x.value_mean).filter((x): x is number => typeof x === "number");
      const valsMedian = byMetric.map((x) => x.value_median).filter((x): x is number => typeof x === "number");
      const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
      const mean = avg(valsMean);
      const median = avg(valsMedian);
      const year = byMetric[0].year;

      const sample = byMetric[0];
      items.push({
        ...sample,
        continent: "Global",
        value_mean: mean,
        value_median: median,
        source: {
          name: "Aggregated from continents (unweighted)",
          url: ""
        },
        note: "Global derived as an unweighted average of continents."
      });
    });
  }

  globalize("monthly_savings");
  globalize("net_wealth");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2), "utf8");
  console.log(`✔ Wrote ${OUT} with ${items.length} records (${CONTINENTS.length} continents × ${AGE_GROUPS.length} ages + Global)`);
}

build();
