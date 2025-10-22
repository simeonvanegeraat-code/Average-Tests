// scripts/build-money-json.ts
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

type Row = Record<string, string>;

const RAW = path.join(process.cwd(), "data", "raw");
const OUT = path.join(process.cwd(), "src", "data", "averages", "money.json");

const CONTINENTS = ["Europe", "Asia", "North America", "South America", "Africa", "Oceania"] as const;
type Continent = typeof CONTINENTS[number];
type MaybeNum = number | null;

const N = (v?: string | number | null): MaybeNum => {
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
 * CSV formats (simple):
 *
 * saving_rate_by_continent.csv
 *   continent,age,year,saving_rate_pct
 *   Europe,25-34,2024,10.5
 *
 * median_income_by_continent.csv
 *   continent,age,year,median_income_eur_year
 *   Europe,25-34,2024,27500
 *
 * wealth_by_continent.csv
 *   continent,age,year,net_wealth_mean_eur,net_wealth_median_eur
 *   Europe,All,2023,180000,100000
 */
function build() {
  const srRows = loadCSV("saving_rate_by_continent.csv");
  const incRows = loadCSV("median_income_by_continent.csv");
  const wlRows = loadCSV("wealth_by_continent.csv");

  const pick = (rows: Row[], continent: string, age: string) =>
    rows.find((r) => r.continent === continent && r.age === age);

  const items: any[] = [];

  // Derived monthly savings per continent (age 25–34)
  CONTINENTS.forEach((c) => {
    const SR = pick(srRows, c, "25-34");
    const INC = pick(incRows, c, "25-34");
    const year = SR?.year || INC?.year || "2024";
    const sr = SR ? N(SR.saving_rate_pct) : null;
    const incomeYear = INC ? N(INC.median_income_eur_year) : null;
    const incomeMonth = incomeYear ? incomeYear / 12 : null;
    const monthlyDerived = sr != null && incomeMonth != null ? Math.round((sr / 100) * incomeMonth) : null;

    items.push({
      id: "monthly_savings_25_34",
      title: "Average monthly savings (25–34)",
      metric: "monthly_savings_eur",
      unit: "€",
      value_mean: monthlyDerived,
      value_median: monthlyDerived,
      continent: c,
      age: "25–34",
      year,
      source: {
        name: c === "Europe" ? "Eurostat (derived)" : "World Bank / national stats (derived)",
        url: ""
      },
      note: c === "Europe" ? "Derived from saving rate × median disposable income." : ""
    });
  });

  // Wealth per continent (All households)
  CONTINENTS.forEach((c) => {
    const WL = pick(wlRows, c, "All");
    const mean = WL ? N(WL.net_wealth_mean_eur) : null;
    const median = WL ? N(WL.net_wealth_median_eur) : null;
    const year = WL?.year || "2023";

    items.push({
      id: "net_wealth_all",
      title: "Average net household wealth (all households)",
      metric: "net_wealth_eur",
      unit: "€",
      value_mean: mean,
      value_median: median,
      continent: c,
      age: "All households",
      year,
      source: {
        name: c === "Europe" ? "ECB HFCS" : "Credit Suisse Global Wealth / national stats",
        url: ""
      },
      note: ""
    });
  });

  // Compute Global as simple average across available continents (TODO: weight by population/income)
  function globalize(metricId: string) {
    const byMetric = items.filter((x) => x.id === metricId);
    const yrs = new Set(byMetric.map((x) => x.year));
    const year = [...yrs].sort().pop();

    const valsMean = byMetric.map((x) => x.value_mean).filter((x): x is number => typeof x === "number");
    const valsMedian = byMetric.map((x) => x.value_median).filter((x): x is number => typeof x === "number");
    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

    const mean = avg(valsMean);
    const median = avg(valsMedian);

    const sample = byMetric[0];
    items.push({
      ...sample,
      continent: "Global",
      year,
      value_mean: mean,
      value_median: median,
      source: {
        name: "Aggregated from continents (unweighted)",
        url: ""
      },
      note: "Global derived as an unweighted average of continents. Replace with weighted method when population weights are added."
    });
  }

  globalize("monthly_savings_25_34");
  globalize("net_wealth_all");

  // Write JSON
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2), "utf8");
  console.log(`✔ Wrote ${OUT} with ${items.length} items`);
}

build();
