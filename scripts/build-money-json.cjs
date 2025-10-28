// scripts/build-money-json.cjs
// Node 22 CJS – bouwt src/data/averages/money.json uit CSV's in /data/raw
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "src", "data", "averages", "money.json");

function N(v) {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function loadCsv(name) {
  const p = path.join(RAW, name);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}
function push(rows, id, title, unit, meanCol, medianCol, source, items) {
  if (!rows) return;
  rows.forEach((r) => {
    items.push({
      id,
      title: `${title} (${r.age})`,
      metric: meanCol || medianCol,
      unit,
      value_mean: meanCol ? N(r[meanCol]) : N(r[medianCol]),
      value_median: medianCol ? N(r[medianCol]) : N(r[meanCol]),
      continent: r.continent,
      age: r.age,
      year: r.year || "2024",
      source: { name: source, url: "" },
      note: ""
    });
  });
}
const AGE_GROUPS = ["18-24","25-34","35-44","45-54","55-64","65+"];
function globalize(items, metricId) {
  AGE_GROUPS.forEach((a) => {
    const arr = items.filter(x => x.id === metricId && x.age === a && x.continent !== "Global");
    if (!arr.length) return;
    const avg = (vals) => (vals.length ? Math.round(vals.reduce((p, q) => p + q, 0) / vals.length) : null);
    const mean = avg(arr.map(x => x.value_mean).filter((n) => typeof n === "number"));
    const median = avg(arr.map(x => x.value_median).filter((n) => typeof n === "number"));
    const sample = {
      ...arr[0],
      continent: "Global",
      value_mean: mean,
      value_median: median,
      source: { name: "Aggregated from continents (unweighted)", url: "" }
    };
    items.push(sample);
  });
}

(function main() {
  // Verwachte CSV-bestanden (zet ze in /data/raw). Kolommen per bestand staan in comments.
  const monthly = loadCsv("money_monthly_savings_eur.csv");        // continent,age,year,mean_eur,median_eur
  const rate    = loadCsv("money_savings_rate_pct.csv");           // continent,age,year,mean_pct,median_pct
  const balance = loadCsv("money_savings_balance_eur.csv");        // continent,age,year,mean_eur,median_eur
  const wealth  = loadCsv("money_net_wealth_eur.csv");             // continent,age,year,mean_eur,median_eur
  const debt    = loadCsv("money_total_debt_eur.csv");             // continent,age,year,mean_eur,median_eur

  const items = [];
  push(monthly, "monthly_savings", "Monthly savings", "€", "mean_eur", "median_eur", "Official stats & surveys", items);
  push(rate,    "savings_rate",    "Savings rate", "%",  "mean_pct",  "median_pct",  "Official stats & surveys", items);
  push(balance, "savings_balance", "Savings balance", "€", "mean_eur", "median_eur", "Official stats & surveys", items);
  push(wealth,  "net_wealth",      "Net household wealth", "€", "mean_eur", "median_eur", "Household finance surveys", items);
  push(debt,    "debt_total",      "Total household debt", "€", "mean_eur", "median_eur", "Household finance surveys", items);

  ["monthly_savings", "savings_rate", "savings_balance", "net_wealth", "debt_total"].forEach((id) =>
    globalize(items, id)
  );

  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  // Als er niets is ingelezen (CSV's ontbreken), houd bestaande JSON in stand,
  // of schrijf één nette placeholder zodat de build niet faalt.
  if (!items.length) {
    if (fs.existsSync(OUT)) {
      console.log("ⓘ No CSVs found for money; keeping existing money.json");
      return;
    }
    const placeholder = [
      {
        id: "monthly_savings",
        title: "Monthly savings (25–34)",
        metric: "mean_eur",
        unit: "€",
        value_mean: null,
        value_median: null,
        continent: "Global",
        age: "25-34",
        year: "2024",
        source: { name: "Pending data import", url: "" },
        note: ""
      }
    ];
    fs.writeFileSync(OUT, JSON.stringify(placeholder, null, 2), "utf8");
    console.log("ⓘ Wrote money.json placeholder (no CSVs present)");
    return;
  }

  fs.writeFileSync(OUT, JSON.stringify(items, null, 2), "utf8");
  console.log(`✔ Wrote ${OUT} with ${items.length} records`);
})();
