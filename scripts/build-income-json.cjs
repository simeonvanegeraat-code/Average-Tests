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

// === INCOME ===
(function main() {
  const items = [];
  const Y = new Date().getFullYear();
  const rows_income_annual_salary_by_continent_age = loadCsv("income_annual_salary_by_continent_age");
  pushRows(rows_income_annual_salary_by_continent_age, { id: "annual_salary", title: "Annual salary", unit: "€", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "OECD / national stats" }, items);
  const rows_income_hours_worked_per_week = loadCsv("income_hours_worked_per_week");
  pushRows(rows_income_hours_worked_per_week, { id: "hours_worked", title: "Hours worked per week", unit: "h/wk", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "OECD / ILO" }, items);
  const rows_income_unemployment_rate = loadCsv("income_unemployment_rate");
  pushRows(rows_income_unemployment_rate, { id: "unemployment", title: "Unemployment rate", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "ILO / World Bank" }, items);
  const rows_income_side_gig_share = loadCsv("income_side_gig_share");
  pushRows(rows_income_side_gig_share, { id: "side_gig_share", title: "Workers with side income", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Surveys" }, items);
  const rows_income_remote_work_share = loadCsv("income_remote_work_share");
  pushRows(rows_income_remote_work_share, { id: "remote_work_share", title: "Remote work share", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Eurostat / surveys" }, items);
  const rows_income_gender_pay_gap_pct = loadCsv("income_gender_pay_gap_pct");
  pushRows(rows_income_gender_pay_gap_pct, { id: "gender_pay_gap", title: "Gender pay gap", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "OECD / Eurostat" }, items);
  // Globalize per metric & age
  globalize(items, "annual_salary");
  globalize(items, "hours_worked");
  globalize(items, "unemployment");
  globalize(items, "side_gig_share");
  globalize(items, "remote_work_share");
  globalize(items, "gender_pay_gap");
  writeOut("income.json", items);
})();