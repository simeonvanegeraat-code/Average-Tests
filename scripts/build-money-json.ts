// CommonJS build-script voor Vercel/Node 22
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "src", "data", "averages", "money.json");

const CONTINENTS = ["Europe","Asia","North America","South America","Africa","Oceania"];
const AGE_GROUPS = ["18-24","25-34","35-44","45-54","55-64","65+"];

const N = (v) => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d\.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

function safeLoadCSV(file) {
  const p = path.join(RAW, file);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function writePlaceholder(reason) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const placeholder = [
    {
      id: "monthly_savings",
      title: "Average monthly savings (25–34)",
      metric: "monthly_savings_eur",
      unit: "€",
      value_mean: null,
      value_median: null,
      continent: "Global",
      age: "25-34",
      year: String(new Date().getFullYear()),
      source: { name: "Pending data import", url: "" },
      note: reason
    }
  ];
  fs.writeFileSync(OUT, JSON.stringify(placeholder, null, 2), "utf8");
  console.log("ⓘ Wrote placeholder money.json:", reason);
}

function build() {
  // CSV’s optioneel: als ze ontbreken, schrijf placeholder i.p.v. falen
  const srRows = safeLoadCSV("saving_rate_by_continent.csv");
  const incRows = safeLoadCSV("median_income_by_continent.csv");
  const wlRows = safeLoadCSV("wealth_by_continent.csv");

  if (!srRows || !incRows || !wlRows) {
    writePlaceholder("Raw CSV files missing in /data/raw. Build skipped gracefully.");
    return;
  }

  const pick = (rows, continent, age) =>
    rows.find((r) => r.continent === continent && r.age === age);

  const items = [];

  // Savings (continent × leeftijd)
  CONTINENTS.forEach((c) => {
    AGE_GROUPS.forEach((a) => {
      const SR = pick(srRows, c, a);
      const INC = pick(incRows, c, a);
      if (!SR && !INC) return;

      const sr = SR ? N(SR.saving_rate_pct) : null;
      const incYear = INC ? N(INC.median_income_eur_year) : null;
      const incMonth = incYear ? incYear / 12 : null;
      const monthly = sr != null && incMonth != null ? Math.round((sr / 100) * incMonth) : null;
      const year = (SR && SR.year) || (INC && INC.year) || "2024";

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
        source: { name: c === "Europe" ? "Eurostat (derived)" : "World Bank / national stats (derived)", url: "" },
        note: "Derived from saving rate × median disposable income per capita."
      });
    });
  });

  // Wealth (continent)
  wlRows.forEach((r) => {
    const mean = N(r.net_wealth_mean_eur);
    const median = N(r.net_wealth_median_eur);
    const c = r.continent;
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
      source: { name: c === "Europe" ? "ECB HFCS" : "Credit Suisse Global Wealth / national stats", url: "" },
      note: "Median is typically lower due to inequality."
    });
  });

  // Global (ongewicht gemiddelde over continenten per age)
  function globalize(metricId) {
    AGE_GROUPS.forEach((a) => {
      const byMetric = items.filter((x) => x.id === metricId && x.age === a && x.continent !== "Global");
      if (!byMetric.length) return;
      const avg = (arr) => (arr.length ? Math.round(arr.reduce((p, q) => p + q, 0) / arr.length) : null);
      const mean = avg(byMetric.map((x) => x.value_mean).filter((n) => typeof n === "number"));
      const median = avg(byMetric.map((x) => x.value_median).filter((n) => typeof n === "number"));
      const sample = byMetric[0];
      items.push({
        ...sample,
        continent: "Global",
        source: { name: "Aggregated from continents (unweighted)", url: "" },
        note: "Global derived as an unweighted average of continents."
      });
    });
  }
  globalize("monthly_savings");
  globalize("net_wealth");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2), "utf8");
  console.log(`✔ Wrote ${OUT} with ${items.length} records`);
}

build();
