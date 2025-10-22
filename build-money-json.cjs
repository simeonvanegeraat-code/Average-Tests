// build-income-json.cjs
// Builds src/data/averages/income.json from CSVs in /data/raw (Node 22, CommonJS)
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "src", "data", "averages", "income.json");

const CONTINENTS = ["Europe","Asia","North America","South America","Africa","Oceania"];
const AGE_GROUPS = ["18-24","25-34","35-44","45-54","55-64","65+"];

function N(v){ if(v==null) return null; const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d\.\-]/g,"")); return Number.isFinite(n)?n:null; }
function load(file){ const p = path.join(RAW,file); if(!fs.existsSync(p)) return null; const raw=fs.readFileSync(p,"utf8"); return parse(raw,{columns:true,skip_empty_lines:true}); }

function ensureOutPlaceholder(why){
  fs.mkdirSync(path.dirname(OUT),{recursive:true});
  if(!fs.existsSync(OUT)){
    fs.writeFileSync(OUT, JSON.stringify([{
      id:"annual_salary", title:"Annual salary (25–34)", metric:"annual_salary_eur", unit:"€",
      value_mean:null, value_median:null, continent:"Global", age:"25-34", year:String(new Date().getFullYear()),
      source:{name:"Pending data import", url:""}, note: why
    }], null, 2));
  }
}

function pushSimple(rows, id, title, unit, col, source, items){
  if(!rows) return;
  rows.forEach(r=>{
    const v = N(r[col]);
    items.push({
      id, title:`${title} (${r.age})`, metric:col, unit,
      value_mean:v, value_median:v, continent:r.continent, age:r.age,
      year:r.year || "2024", source:{ name: source, url:"" }, note:""
    });
  });
}

function globalize(items, metricId){
  AGE_GROUPS.forEach(a=>{
    const arr = items.filter(x=>x.id===metricId && x.age===a && x.continent!=="Global");
    if(!arr.length) return;
    const avg = vals => vals.length ? Math.round(vals.reduce((p,q)=>p+q,0)/vals.length) : null;
    const mean = avg(arr.map(x=>x.value_mean).filter(n=>typeof n==="number"));
    const median = avg(arr.map(x=>x.value_median).filter(n=>typeof n==="number"));
    const sample = {...arr[0], continent:"Global", value_mean:mean, value_median:median,
      source:{ name:"Aggregated from continents (unweighted)", url:"" },
      note: ((arr[0].note||"") + " Global = simple average across continents.").trim()
    };
    items.push(sample);
  });
}

function main(){
  const rows = {
    salary: load("annual_salary_by_continent_age.csv"),
    hours: load("hours_worked_per_week.csv"),
    unemployment: load("unemployment_rate.csv"),
    sideGig: load("side_gig_share.csv"),
    remote: load("remote_work_share.csv"),
    paygap: load("gender_pay_gap_pct.csv"),
    jobSwitch: load("job_switch_rate.csv"),
  };

  if(!rows.salary){
    ensureOutPlaceholder("Missing annual_salary_by_continent_age.csv in /data/raw");
    console.log("ⓘ Wrote income.json placeholder");
    return;
  }

  const items = [];

  // 1) Annual salary
  rows.salary.forEach(r=>{
    items.push({
      id:"annual_salary",
      title:`Annual salary (${r.age})`,
      metric:"annual_salary_eur",
      unit:"€",
      value_mean:N(r.annual_salary_mean_eur),
      value_median:N(r.annual_salary_median_eur),
      continent:r.continent, age:r.age, year:r.year || "2024",
      source:{ name:"OECD / national stats", url:"" }, note:""
    });
  });

  // 2) Hours worked p/w
  pushSimple(rows.hours, "hours_worked", "Hours worked per week", "h/wk", "hours_mean", "OECD / ILO", items);

  // 3) Unemployment rate %
  pushSimple(rows.unemployment, "unemployment", "Unemployment rate", "%", "unemployment_rate_pct", "ILO / World Bank", items);

  // 4) Side-gig share %
  pushSimple(rows.sideGig, "side_gig_share", "Workers with side income", "%", "side_gig_share_pct", "Survey / national stats", items);

  // 5) Remote work share %
  pushSimple(rows.remote, "remote_work_share", "Remote work share", "%", "remote_work_share_pct", "Eurostat / surveys", items);

  // 6) Gender pay gap %
  pushSimple(rows.paygap, "gender_pay_gap", "Gender pay gap", "%", "gender_pay_gap_pct", "OECD / Eurostat", items);

  // 7) Job switch rate %
  pushSimple(rows.jobSwitch, "job_switch_rate", "Job switch rate", "%", "job_switch_rate_pct", "Labour force surveys", items);

  // Global (ongewogen) per metric × leeftijd
  ["annual_salary","hours_worked","unemployment","side_gig_share","remote_work_share","gender_pay_gap","job_switch_rate"].forEach(id=>globalize(items, id));

  fs.mkdirSync(path.dirname(OUT),{recursive:true});
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2), "utf8");
  console.log(`✔ Wrote ${OUT} with ${items.length} records`);
}

main();
