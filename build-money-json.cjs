// CommonJS build script (root). Node 22 compatible.
// Builds src/data/averages/money.json from CSVs in /data/raw
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "src", "data", "averages", "money.json");

const CONTINENTS = ["Europe","Asia","North America","South America","Africa","Oceania"];
const AGE_GROUPS = ["18-24","25-34","35-44","45-54","55-64","65+"];

const N = (v) => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d\.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

function load(file) {
  const p = path.join(RAW, file);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function ensureOut(why) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (!fs.existsSync(OUT)) {
    fs.writeFileSync(
      OUT,
      JSON.stringify(
        [{
          id: "monthly_savings",
          title: "Average monthly savings (25–34)",
          metric: "monthly_savings_eur",
          unit: "€",
          value_mean: null,
          value_median: null,
          continent: "Global",
          age: "25-34",
          year: String(new Date().getFullYear()),
          source: { name: "Pending data import", url: "" },
          note: why
        }],
        null, 2
      ),
      "utf8"
    );
  }
}

function main() {
  const rows = {
    savingRate: load("saving_rate_by_continent.csv"),
    medianIncome: load("median_income_by_continent.csv"),
    wealth: load("wealth_by_continent.csv"),
    savingsBalance: load("savings_balance_by_continent.csv"),
    debtTotal: load("debt_total_by_continent.csv"),
    annualReturn: load("annual_return_pct_by_continent.csv"),
    noSavingsShare: load("no_savings_share_pct_by_continent.csv"),
    starterCapital: load("starter_capital_by_age_continent.csv"),
  };

  // Als de verplichte basistabellen ontbreken, schrijf placeholder en stop
  if (!rows.savingRate || !rows.medianIncome || !rows.wealth) {
    ensureOut("Base CSVs missing in /data/raw");
    console.log("ⓘ Wrote placeholder money.json (missing CSVs)");
    return;
  }

  const items = [];
  const pick = (arr, c, a) => arr?.find((r) => r.continent === c && r.age === a);

  // 1) Maandelijks spaargeld (afgeleid: saving rate × inkomen / 12)
  CONTINENTS.forEach((c) => {
    AGE_GROUPS.forEach((a) => {
      const sr = pick(rows.savingRate, c, a);
      const inc = pick(rows.medianIncome, c, a);
      if (!sr && !inc) return;
      const srPct = sr ? N(sr.saving_rate_pct) : null;
      const incYear = inc ? N(inc.median_income_eur_year) : null;
      const monthly = srPct != null && incYear != null ? Math.round((srPct / 100) * (incYear / 12)) : null;
      const year = (sr && sr.year) || (inc && inc.year) || "2024";
      items.push({
        id: "monthly_savings",
        title: `Average monthly savings (${a})`,
        metric: "monthly_savings_eur",
        unit: "€",
        value_mean: monthly,
        value_median: monthly,
        continent: c, age: a, year,
        source: { name: c === "Europe" ? "Eurostat (derived)" : "World Bank / national stats (derived)", url: "" },
        note: "Derived from saving rate × median disposable income per capita."
      });
    });
  });

  // 2) Spaarpercentage t.o.v. inkomen (%)
  rows.savingRate.forEach((r) => {
    items.push({
      id: "savings_rate",
      title: `Savings rate vs income (${r.age})`,
      metric: "savings_rate_pct",
      unit: "%",
      value_mean: N(r.saving_rate_pct),
      value_median: N(r.saving_rate_pct),
      continent: r.continent,
      age: r.age,
      year: r.year || "2024",
      source: { name: "Eurostat / OECD", url: "" },
      note: ""
    });
  });

  // 3) Gemiddeld spaarsaldo per huishouden (€, banksaldo)
  rows.savingsBalance?.forEach((r) => {
    items.push({
      id: "savings_balance",
      title: `Average savings balance (${r.age})`,
      metric: "savings_balance_eur",
      unit: "€",
      value_mean: N(r.savings_balance_mean_eur),
      value_median: N(r.savings_balance_median_eur),
      continent: r.continent,
      age: r.age,
      year: r.year || "2023",
      source: { name: "HFCS / national stats", url: "" },
      note: ""
    });
  });

  // 4 & 5) Netto vermogen (mean & median)
  rows.wealth.forEach((r) => {
    items.push({
      id: "net_wealth",
      title: `Average net household wealth (${r.age})`,
      metric: "net_wealth_eur",
      unit: "€",
      value_mean: N(r.net_wealth_mean_eur),
      value_median: N(r.net_wealth_median_eur),
      continent: r.continent,
      age: r.age || "All",
      year: r.year || "2023",
      source: { name: r.continent === "Europe" ? "ECB HFCS" : "Credit Suisse Global Wealth", url: "" },
      note: "Median gives the typical household; mean is higher due to top wealth."
    });
  });

  // 6) Gemiddelde schuldenlast (€, hypotheek + consumptief)
  rows.debtTotal?.forEach((r) => {
    items.push({
      id: "debt_total",
      title: `Average household debt (${r.age})`,
      metric: "debt_total_eur",
      unit: "€",
      value_mean: N(r.debt_total_mean_eur),
      value_median: N(r.debt_total_median_eur),
      continent: r.continent,
      age: r.age,
      year: r.year || "2023",
      source: { name: "ECB / Eurostat (household debt)", url: "" },
      note: ""
    });
  });

  // 7) Gemiddeld jaarlijks rendement (%)
  rows.annualReturn?.forEach((r) => {
    items.push({
      id: "annual_return",
      title: `Average annual return (${r.age})`,
      metric: "annual_return_pct",
      unit: "%",
      value_mean: N(r.annual_return_pct_mean),
      value_median: N(r.annual_return_pct_median),
      continent: r.continent,
      age: r.age,
      year: r.year || "10y avg",
      source: { name: "ECB DW / MSCI / Morningstar (indices)", url: "" },
      note: "Indicative, based on regional index mixes and deposit rates."
    });
  });

  // 8) Startkapitaal per leeftijdsgroep (€, opgebouwd vermogen)
  rows.starterCapital?.forEach((r) => {
    items.push({
      id: "starter_capital",
      title: `Starter capital (${r.age})`,
      metric: "starter_capital_eur",
      unit: "€",
      value_mean: N(r.starter_capital_mean_eur),
      value_median: N(r.starter_capital_median_eur),
      continent: r.continent,
      age: r.age,
      year: r.year || "2023",
      source: { name: "HFCS microdata / derived", url: "" },
      note: "Indicative build-up by age group."
    });
  });

  // 9) Aantal mensen zonder spaargeld (% van huishoudens)
  rows.noSavingsShare?.forEach((r) => {
    items.push({
      id: "no_savings_share",
      title: `Households with no savings (${r.age})`,
      metric: "no_savings_share_pct",
      unit: "%",
      value_mean: N(r.no_savings_share_pct),
      value_median: N(r.no_savings_share_pct),
      continent: r.continent,
      age: r.age,
      year: r.year || "2023",
      source: { name: "OECD Better Life Index / HFCS", url: "" },
      note: "Share of households with zero liquid savings."
    });
  });

  // ---- Global (ongewogen) per metric × leeftijd
  function globalize(metricId) {
    AGE_GROUPS.forEach((age) => {
      const group = items.filter((x) => x.id === metricId && x.age === age && x.continent !== "Global");
      if (!group.length) return;
      const avg = (arr) => (arr.length ? Math.round(arr.reduce((p,q)=>p+q,0) / arr.length) : null);
      const mean = avg(group.map((x)=>x.value_mean).filter((n)=>typeof n==="number"));
      const median = avg(group.map((x)=>x.value_median).filter((n)=>typeof n==="number"));
      const sample = group[0];
      items.push({
        ...sample,
        continent: "Global",
        value_mean: mean,
        value_median: median,
        source: { name: "Aggregated from continents (unweighted)", url: "" },
        note: (sample.note || "") + " Global = simple average across continents."
      });
    });
  }
  ["monthly_savings","savings_rate","savings_balance","net_wealth","debt_total","annual_return","starter_capital","no_savings_share"].forEach(globalize);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(items, null, 2), "utf8");
  console.log(`✔ Wrote ${OUT} with ${items.length} records`);
}

main();
