// Auto-generated build script (Node 22, CommonJS)
// Reads CSV under data/raw and writes JSON to src/data/averages/{cat}.json
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = (file) => path.join(ROOT, "src", "data", "averages", file);

function N(v){ if(v==null) return null; const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.\-]/g,"")); return Number.isFinite(n)?n:null; }
function loadCsv(name){ const p = path.join(RAW, name); if(!fs.existsSync(p)) return null; const raw=fs.readFileSync(p,"utf8"); return parse(raw,{columns:true,skip_empty_lines:true}); }
function pushSimple(rows, id, title, unit, col, source, items){
  if(!rows) return;
  rows.forEach(r=>{
    const v = N(r[col]);
    items.push({ id, title:`${title} (${r.age})`, metric:col, unit,
      value_mean:v, value_median:v, continent:r.continent, age:r.age,
      year:r.year || "2024", source:{name:source, url:""}, note:"" });
  });
}
const AGE_GROUPS = ["18-24","25-34","35-44","45-54","55-64","65+"];
function globalize(items, metricId){
  AGE_GROUPS.forEach(a=>{
    const arr = items.filter(x=>x.id===metricId && x.age===a && x.continent!=="Global");
    if(!arr.length) return;
    const avg = vals => vals.length ? Math.round(vals.reduce((p,q)=>p+q,0)/vals.length) : null;
    const mean = avg(arr.map(x=>x.value_mean).filter(n=>typeof n==="number"));
    const median = avg(arr.map(x=>x.value_median).filter(n=>typeof n==="number"));
    const sample = {...arr[0], continent:"Global", value_mean:mean, value_median:median,
      source:{name:"Aggregated from continents (unweighted)", url:""} };
    items.push(sample);
  });
}

(function main(){
  const morning = loadCsv("habits_morning_person_share_pct.csv");
  const books = loadCsv("habits_books_per_year_median.csv");
  const dine = loadCsv("habits_restaurant_meals_per_week_mean.csv");
  const items = [];
  pushSimple(morning, "morning_person", "Morning person share", "%", "morning_person_share_pct", "Lifestyle surveys (demo)", items);
  pushSimple(books, "books_per_year", "Books per year (median)", "", "books_per_year_median", "Reading surveys (demo)", items);
  pushSimple(dine, "restaurant_meals", "Restaurant meals per week", "x/wk", "restaurant_meals_per_week_mean", "Consumer surveys (demo)", items);
  ["morning_person","books_per_year","restaurant_meals"].forEach(id=>globalize(items, id));
  fs.mkdirSync(path.dirname(OUT("habits.json")), {recursive:true});
  fs.writeFileSync(OUT("habits.json"), JSON.stringify(items, null, 2));
  console.log(`✔ Wrote ${OUT("habits.json")} with ${items.length} records`);
})();
