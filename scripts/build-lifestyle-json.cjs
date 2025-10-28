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

// === LIFESTYLE ===
(function main() {
  const items = [];
  const Y = new Date().getFullYear();
  const rows_lifestyle_homeownership_rate_pct = loadCsv("lifestyle_homeownership_rate_pct");
  pushRows(rows_lifestyle_homeownership_rate_pct, { id: "homeownership", title: "Homeownership rate", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Eurostat / OECD" }, items);
  const rows_lifestyle_household_size_mean = loadCsv("lifestyle_household_size_mean");
  pushRows(rows_lifestyle_household_size_mean, { id: "household_size", title: "Household size", unit: "people", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "OECD / UN" }, items);
  const rows_lifestyle_first_child_age_mean = loadCsv("lifestyle_first_child_age_mean");
  pushRows(rows_lifestyle_first_child_age_mean, { id: "first_child_age", title: "Age at first child", unit: "years", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Eurostat / national stats" }, items);
  const rows_lifestyle_marriage_rate = loadCsv("lifestyle_marriage_rate");
  pushRows(rows_lifestyle_marriage_rate, { id: "marriage_rate", title: "Marriage rate (per 1,000)", unit: "per 1k", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "UN / national stats" }, items);
  const rows_lifestyle_divorce_rate = loadCsv("lifestyle_divorce_rate");
  pushRows(rows_lifestyle_divorce_rate, { id: "divorce_rate", title: "Divorce rate (per 1,000)", unit: "per 1k", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "UN / national stats" }, items);
  const rows_lifestyle_has_children_share_pct = loadCsv("lifestyle_has_children_share_pct");
  pushRows(rows_lifestyle_has_children_share_pct, { id: "has_children_share", title: "Adults with children (25–44)", unit: "%", meanCol: "value_mean", medianCol: "value_median", defaultYear: Y, sourceName: "Surveys" }, items);
  // Globalize per metric & age
  globalize(items, "homeownership");
  globalize(items, "household_size");
  globalize(items, "first_child_age");
  globalize(items, "marriage_rate");
  globalize(items, "divorce_rate");
  globalize(items, "has_children_share");
  writeOut("lifestyle.json", items);
})();