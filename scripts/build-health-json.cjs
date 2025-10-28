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

// === HEALTH ===
(function main() {
  const items = [];
  const Y = new Date().getFullYear();
  const rows_health_sleep_hours_mean = loadCsv("health_sleep_hours_mean");
  pushRows(rows_health_sleep_hours_mean, { id: "sleep_hours", title: "Sleep hours per night", unit: "h/night", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Health surveys" }, items);
  const rows_health_steps_per_day_mean = loadCsv("health_steps_per_day_mean");
  pushRows(rows_health_steps_per_day_mean, { id: "steps_per_day", title: "Steps per day", unit: "steps", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Wearables / surveys" }, items);
  const rows_health_obesity_rate_pct = loadCsv("health_obesity_rate_pct");
  pushRows(rows_health_obesity_rate_pct, { id: "obesity_rate", title: "Obesity rate", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "WHO / OECD" }, items);
  const rows_health_exercise_days_per_week_mean = loadCsv("health_exercise_days_per_week_mean");
  pushRows(rows_health_exercise_days_per_week_mean, { id: "exercise_days", title: "Exercise days per week", unit: "days/wk", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Health surveys" }, items);
  const rows_health_rhr_median = loadCsv("health_rhr_median");
  pushRows(rows_health_rhr_median, { id: "resting_hr", title: "Resting heart rate (median)", unit: "bpm", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Fitness datasets" }, items);
  const rows_health_smoking_rate_pct = loadCsv("health_smoking_rate_pct");
  pushRows(rows_health_smoking_rate_pct, { id: "smoking_rate", title: "Smoking prevalence", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "WHO / Eurostat" }, items);
  // Globalize per metric & age
  globalize(items, "sleep_hours");
  globalize(items, "steps_per_day");
  globalize(items, "obesity_rate");
  globalize(items, "exercise_days");
  globalize(items, "resting_hr");
  globalize(items, "smoking_rate");
  writeOut("health.json", items);
})();