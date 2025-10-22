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
  const salary = loadCsv("money_monthly_savings_by_continent_age.csv");
  const rate = loadCsv("money_savings_rate_pct.csv");
  const wealth = loadCsv("money_net_wealth_median.csv");
  const items = [];
  if(salary){
    salary.forEach(r=>{
      items.push({
        id:"monthly_savings", title:`Average monthly savings (${r.age})`, metric:"monthly_savings_eur", unit:"€",
        value_mean:N(r.monthly_savings_mean_eur), value_median:N(r.monthly_savings_median_eur),
        continent:r.continent, age:r.age, year:r.year || "2024",
        source:{name:"Eurostat/OECD (demo)", url:""}, note:""
      });
    });
  }
  pushSimple(rate, "savings_rate", "Savings rate vs income", "%", "savings_rate_pct", "Eurostat (demo)", items);
  pushSimple(wealth, "net_wealth", "Median net household wealth", "€", "net_wealth_median_eur", "HFCS / OECD (demo)", items);

  ["monthly_savings","savings_rate","net_wealth"].forEach(id=>globalize(items, id));
  fs.mkdirSync(path.dirname(OUT("money.json")), {recursive:true});
  fs.writeFileSync(OUT("money.json"), JSON.stringify(items, null, 2));
  console.log(`✔ Wrote ${OUT("money.json")} with ${items.length} records`);
})();
