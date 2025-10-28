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

// === PRODUCTIVITY ===
(function main() {
  const items = [];
  const Y = new Date().getFullYear();
  const rows_productivity_focus_span_minutes_mean = loadCsv("productivity_focus_span_minutes_mean");
  pushRows(rows_productivity_focus_span_minutes_mean, { id: "focus_span", title: "Focus span", unit: "min", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Work/learning surveys" }, items);
  const rows_productivity_study_hours_per_week_mean = loadCsv("productivity_study_hours_per_week_mean");
  pushRows(rows_productivity_study_hours_per_week_mean, { id: "study_hours", title: "Study/learning hours per week", unit: "h/wk", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Education/work surveys" }, items);
  const rows_productivity_deep_work_hours_mean = loadCsv("productivity_deep_work_hours_mean");
  pushRows(rows_productivity_deep_work_hours_mean, { id: "deep_work_hours", title: "Deep-work hours per day", unit: "h/day", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Work surveys" }, items);
  const rows_productivity_task_completion_pct = loadCsv("productivity_task_completion_pct");
  pushRows(rows_productivity_task_completion_pct, { id: "task_completion", title: "Task completion rate per day", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Work mgmt surveys" }, items);
  const rows_productivity_meeting_hours_mean = loadCsv("productivity_meeting_hours_mean");
  pushRows(rows_productivity_meeting_hours_mean, { id: "meeting_hours", title: "Meeting time per day", unit: "h/day", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Workplace surveys" }, items);
  const rows_productivity_interruptions_per_hour_mean = loadCsv("productivity_interruptions_per_hour_mean");
  pushRows(rows_productivity_interruptions_per_hour_mean, { id: "interruptions_per_hour", title: "Interruptions per hour", unit: "per hr", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Workplace studies" }, items);
  // Globalize per metric & age
  globalize(items, "focus_span");
  globalize(items, "study_hours");
  globalize(items, "deep_work_hours");
  globalize(items, "task_completion");
  globalize(items, "meeting_hours");
  globalize(items, "interruptions_per_hour");
  writeOut("productivity.json", items);
})();