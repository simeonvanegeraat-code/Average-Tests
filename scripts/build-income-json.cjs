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
  const salary = loadCsv("income_annual_salary_by_continent_age.csv");
  const hours = loadCsv("income_hours_worked_per_week.csv");
  const unemp = loadCsv("income_unemployment_rate.csv");
  const side = loadCsv("income_side_gig_share.csv");
  const remote = loadCsv("income_remote_work_share.csv");
  const gap = loadCsv("income_gender_pay_gap_pct.csv");
  const switchR = loadCsv("income_job_switch_rate.csv");
  const items = [];
  if(salary){
    salary.forEach(r=>{
      items.push({
        id:"annual_salary", title:`Annual salary (${r.age})`, metric:"annual_salary_eur", unit:"€",
        value_mean:N(r.annual_salary_mean_eur), value_median:N(r.annual_salary_median_eur),
        continent:r.continent, age:r.age, year:r.year || "2024",
        source:{name:"OECD (demo)", url:""}, note:""
      });
    });
  }
  if(hours){
    hours.forEach(r=>{
      items.push({
        id:"hours_worked", title:`Hours worked per week (${r.age})`, metric:"hours_per_week", unit:"h/wk",
        value_mean:N(r.hours_mean), value_median:N(r.hours_median),
        continent:r.continent, age:r.age, year:r.year || "2024",
        source:{name:"OECD/ILO (demo)", url:""}, note:""
      });
    });
  }
  pushSimple(unemp, "unemployment", "Unemployment rate", "%", "unemployment_rate_pct", "ILO (demo)", items);
  pushSimple(side, "side_gig_share", "Workers with side income", "%", "side_gig_share_pct", "Surveys (demo)", items);
  pushSimple(remote, "remote_work_share", "Remote work share", "%", "remote_work_share_pct", "Eurostat (demo)", items);
  pushSimple(gap, "gender_pay_gap", "Gender pay gap", "%", "gender_pay_gap_pct", "OECD (demo)", items);
  pushSimple(switchR, "job_switch_rate", "Job switch rate", "%", "job_switch_rate_pct", "LFS (demo)", items);

  ["annual_salary","hours_worked","unemployment","side_gig_share","remote_work_share","gender_pay_gap","job_switch_rate"].forEach(id=>globalize(items, id));
  fs.mkdirSync(path.dirname(OUT("income.json")), {recursive:true});
  fs.writeFileSync(OUT("income.json"), JSON.stringify(items, null, 2));
  console.log(`✔ Wrote ${OUT("income.json")} with ${items.length} records`);
})();
