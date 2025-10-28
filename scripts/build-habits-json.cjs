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

// === HABITS ===
(function main() {
  const items = [];
  const Y = new Date().getFullYear();
  const rows_habits_morning_person_share_pct = loadCsv("habits_morning_person_share_pct");
  pushRows(rows_habits_morning_person_share_pct, { id: "morning_person", title: "Morning person share", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Lifestyle surveys" }, items);
  const rows_habits_books_per_year_median = loadCsv("habits_books_per_year_median");
  pushRows(rows_habits_books_per_year_median, { id: "books_per_year", title: "Books per year (median)", unit: "", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Reading surveys" }, items);
  const rows_habits_restaurant_meals_per_week_mean = loadCsv("habits_restaurant_meals_per_week_mean");
  pushRows(rows_habits_restaurant_meals_per_week_mean, { id: "restaurant_meals", title: "Restaurant meals per week", unit: "x/wk", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Consumer surveys" }, items);
  const rows_habits_coffee_cups_per_day_mean = loadCsv("habits_coffee_cups_per_day_mean");
  pushRows(rows_habits_coffee_cups_per_day_mean, { id: "coffee_cups", title: "Coffee cups per day", unit: "cups/day", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Lifestyle surveys" }, items);
  // Globalize per metric & age
  globalize(items, "morning_person");
  globalize(items, "books_per_year");
  globalize(items, "restaurant_meals");
  globalize(items, "coffee_cups");
  writeOut("habits.json", items);
})();