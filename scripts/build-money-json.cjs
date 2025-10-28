/**
 * Build script (Node 22, CommonJS)
 * Reads CSV files under /data/raw and writes JSON to /src/data/averages/<category>.json.
 * Defensive: skips missing CSVs and still writes what's available.
 */
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUTDIR = path.join(ROOT, "src", "data", "averages");

function N(v){
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.\-]/g,""));
  return Number.isFinite(n) ? n : null;
}
function loadCsv(name){
  const p = path.join(RAW, name + ".csv");
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}
function pushRows(rows, {id, title, unit, meanCol, medianCol, defaultYear, sourceName}, items){
  if (!rows) return;
  rows.forEach(r => {
    const mean = meanCol ? N(r[meanCol]) : null;
    const median = medianCol ? N(r[medianCol]) : (meanCol ? N(r[meanCol]) : null);
    items.push({
      id,
      title: `${title} (${r.age})`,
      metric: meanCol || medianCol || id,
      unit,
      value_mean: mean,
      value_median: median,
      continent: r.continent || "Global",
      age: r.age || "18-24",
      year: String(r.year || defaultYear || new Date().getFullYear()),
      source: { name: r.source_name || sourceName || "", url: r.source_url || "" },
      note: ""
    });
  });
}
const AGE_GROUPS = ["18-24","25-34","35-44","45-54","55-64","65+"];
function globalize(items, metricId){
  AGE_GROUPS.forEach(a=>{
    const arr = items.filter(x => x.id===metricId && x.age===a && x.continent!=="Global");
    if (!arr.length) return;
    const valsMean = arr.map(x=>x.value_mean).filter(x=>typeof x==="number");
    const valsMedian = arr.map(x=>x.value_median).filter(x=>typeof x==="number");
    const avg = vs => vs.length ? Math.round(vs.reduce((p,q)=>p+q,0)/vs.length) : null;
    const sample = { ...arr[0] };
    sample.continent = "Global";
    sample.value_mean = avg(valsMean);
    sample.value_median = avg(valsMedian);
    sample.source = { name: "Aggregated from continents (unweighted)", url: "" };
    items.push(sample);
  });
}
function writeOut(filename, items){
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const outPath = path.join(OUTDIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2), "utf8");
  console.log(`✔ Wrote ${outPath} with ${items.length} records`);
}

// === MONEY ===
(function main() {
  const items = [];
  const Y = new Date().getFullYear();
  const rows_money_monthly_savings_by_continent_age = loadCsv("money_monthly_savings_by_continent_age");
  pushRows(rows_money_monthly_savings_by_continent_age, { id: "monthly_savings", title: "Average monthly savings", unit: "€", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Eurostat/OECD (derived)" }, items);
  const rows_money_savings_rate_pct = loadCsv("money_savings_rate_pct");
  pushRows(rows_money_savings_rate_pct, { id: "savings_rate", title: "Savings rate vs income", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Eurostat/OECD" }, items);
  const rows_money_net_wealth_median = loadCsv("money_net_wealth_median");
  pushRows(rows_money_net_wealth_median, { id: "net_wealth", title: "Net household wealth (median)", unit: "€", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "OECD / ECB HFCS" }, items);
  const rows_money_savings_balance_median = loadCsv("money_savings_balance_median");
  pushRows(rows_money_savings_balance_median, { id: "savings_balance", title: "Savings balance (median)", unit: "€", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "HFCS / national stats" }, items);
  const rows_money_no_savings_share_pct = loadCsv("money_no_savings_share_pct");
  pushRows(rows_money_no_savings_share_pct, { id: "no_savings_share", title: "Adults with no savings", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Household surveys" }, items);
  const rows_money_starter_capital_25_34 = loadCsv("money_starter_capital_25_34");
  pushRows(rows_money_starter_capital_25_34, { id: "starter_capital", title: "Starter capital (25–34)", unit: "€", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "HFCS / surveys" }, items);
  // Globalize per metric & age
  globalize(items, "monthly_savings");
  globalize(items, "savings_rate");
  globalize(items, "net_wealth");
  globalize(items, "savings_balance");
  globalize(items, "no_savings_share");
  globalize(items, "starter_capital");
  writeOut("money.json", items);
})();