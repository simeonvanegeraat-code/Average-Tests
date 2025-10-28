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

// === TECH ===
(function main() {
  const items = [];
  const Y = new Date().getFullYear();
  const rows_tech_internet_penetration_pct = loadCsv("tech_internet_penetration_pct");
  pushRows(rows_tech_internet_penetration_pct, { id: "internet_penetration", title: "Internet penetration", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "ITU / World Bank" }, items);
  const rows_tech_smartphone_penetration_pct = loadCsv("tech_smartphone_penetration_pct");
  pushRows(rows_tech_smartphone_penetration_pct, { id: "smartphone_penetration", title: "Smartphone penetration", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "ITU / industry reports" }, items);
  const rows_tech_screen_time_hours_mean = loadCsv("tech_screen_time_hours_mean");
  pushRows(rows_tech_screen_time_hours_mean, { id: "screen_time", title: "Screen time", unit: "h/day", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Digital wellbeing surveys" }, items);
  const rows_tech_social_media_hours_mean = loadCsv("tech_social_media_hours_mean");
  pushRows(rows_tech_social_media_hours_mean, { id: "social_media_time", title: "Social media time", unit: "h/day", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Surveys" }, items);
  const rows_tech_pc_access_pct = loadCsv("tech_pc_access_pct");
  pushRows(rows_tech_pc_access_pct, { id: "pc_access", title: "PC access at home", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Eurostat / ITU" }, items);
  const rows_tech_broadband_speed_median = loadCsv("tech_broadband_speed_median");
  pushRows(rows_tech_broadband_speed_median, { id: "broadband_speed", title: "Broadband speed (median)", unit: "Mbps", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Ookla / ITU" }, items);
  // Globalize per metric & age
  globalize(items, "internet_penetration");
  globalize(items, "smartphone_penetration");
  globalize(items, "screen_time");
  globalize(items, "social_media_time");
  globalize(items, "pc_access");
  globalize(items, "broadband_speed");
  writeOut("tech.json", items);
})();