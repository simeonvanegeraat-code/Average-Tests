// scripts/build-habits-json.cjs
// Node 22 CJS – bouwt src/data/averages/habits.json uit CSV's in /data/raw
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "src", "data", "averages", "habits.json");

function N(v){ if(v==null) return null; const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.\-]/g,"")); return Number.isFinite(n)?n:null; }
function loadCsv(name){ const p = path.join(RAW, name); if(!fs.existsSync(p)) return null; const raw=fs.readFileSync(p,"utf8"); return parse(raw,{columns:true,skip_empty_lines:true}); }
function pushSimple(rows, id, title, unit, col, source, items){
  if(!rows) return;
  rows.forEach(r=>{
    const v = N(r[col]);
    items.push({
      id, title:`${title} (${r.age})`, metric:col, unit,
      value_mean:v, value_median:v, continent:r.continent, age:r.age,
      year:r.year || "2024", source:{name:source, url:""}, note:""
    });
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
  const morning = loadCsv("habits_morning_person_share_pct.csv");            // continent,age,year,morning_person_share_pct
  const books   = loadCsv("habits_books_per_year_median.csv");               // continent,age,year,books_per_year_median
  const dine    = loadCsv("habits_restaurant_meals_per_week_mean.csv");      // continent,age,year,restaurant_meals_per_week_mean
  const coffee  = loadCsv("habits_cups_coffee_per_day_mean.csv");            // (optioneel) continent,age,year,cups_coffee_per_day_mean
  const alcohol = loadCsv("habits_alcoholic_drinks_per_week_mean.csv");      // (optioneel) continent,age,year,alcoholic_drinks_per_week_mean

  const items = [];
  pushSimple(morning, "morning_person",   "Morning person share", "%",   "morning_person_share_pct",          "Lifestyle surveys", items);
  pushSimple(books,   "books_per_year",   "Books per year (median)", "", "books_per_year_median",              "Reading surveys",   items);
  pushSimple(dine,    "restaurant_meals", "Restaurant meals per week", "x/wk", "restaurant_meals_per_week_mean","Consumer surveys",  items);
  pushSimple(coffee,  "coffee_per_day",   "Cups of coffee per day", "cups", "cups_coffee_per_day_mean",         "Household surveys", items);
  pushSimple(alcohol, "drinks_per_week",  "Alcoholic drinks per week", "x/wk", "alcoholic_drinks_per_week_mean", "Health surveys",    items);

  ["morning_person","books_per_year","restaurant_meals","coffee_per_day","drinks_per_week"].forEach(id=>globalize(items, id));

  fs.mkdirSync(path.dirname(OUT), {recursive:true});
  if (!items.length) {
    if (fs.existsSync(OUT)) {
      console.log("ⓘ No CSVs found for habits; keeping existing habits.json");
      return;
    }
    fs.writeFileSync(OUT, JSON.stringify([], null, 2));
    console.log("ⓘ Wrote empty habits.json (no CSVs present)");
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2));
  console.log(`✔ Wrote ${OUT} with ${items.length} records`);
})();
