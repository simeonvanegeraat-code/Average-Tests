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
  const screen = loadCsv("tech_screen_time_hours_mean.csv");
  const net = loadCsv("tech_internet_penetration_pct.csv");
  const phone = loadCsv("tech_smartphone_penetration_pct.csv");
  const items = [];
  pushSimple(screen, "screen_time", "Screen time per day", "h", "screen_time_hours_mean", "Usage surveys (demo)", items);
  pushSimple(net, "internet_penetration", "Internet penetration", "%", "internet_penetration_pct", "ITU/World Bank (demo)", items);
  pushSimple(phone, "smartphone_penetration", "Smartphone penetration", "%", "smartphone_penetration_pct", "Consumer reports (demo)", items);
  ["screen_time","internet_penetration","smartphone_penetration"].forEach(id=>globalize(items, id));
  fs.mkdirSync(path.dirname(OUT("tech.json")), {recursive:true});
  fs.writeFileSync(OUT("tech.json"), JSON.stringify(items, null, 2));
  console.log(`✔ Wrote ${OUT("tech.json")} with ${items.length} records`);
})();
