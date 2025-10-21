// src/components/TestRunner.tsx

import { useRouter } from "next/router";
import tests from "@/data/tests";

type InputConfig = {
  type: "select" | "number";
  name: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  required?: boolean;
  default?: number | string;
};

type LabelBand = {
  minDelta: number;
  maxDelta: number;
  label: string;
  advice: string;
};

type Bucket = {
  region: string;
  min: number;
  max: number;
  avgSavings: number;
  medianSavings: number;
  avgWealth?: number;
  medianWealth?: number;
};

type TestConfig = {
  slug: string;
  title: string;
  intro: string;
  inputs: InputConfig[];
  benchmark: {
    region_age_buckets: Bucket[];
  };
  labels: LabelBand[];
  unit: string;
  seo?: { title?: string; description?: string };
};

export default function TestRunner({ slug }: { slug: string }) {
  const router = useRouter();
  const test = (tests as TestConfig[]).find((t) => t.slug === slug);

  if (!test) {
    return <div className="card">Test not found.</div>;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const region = (fd.get("region") as string) || "";
    const age = Number(fd.get("age"));
    const monthlySavings = Number(fd.get("monthly_savings"));
    const monthlyIncome = Number(fd.get("monthly_income"));
    const currentSavings = Number(fd.get("current_savings_balance") ?? 0);
    const grossWealth = Number(fd.get("gross_wealth") ?? 0);

    const bucket =
      test.benchmark.region_age_buckets.find(
        (b) => b.region === region && age >= b.min && age <= b.max
      ) ?? test.benchmark.region_age_buckets[0];

    const median = bucket.medianSavings;
    const avg = bucket.avgSavings;

    const delta = Number((((monthlySavings - median) / median) * 100).toFixed(1));
    const savingsRate = Number(
      (((monthlySavings / monthlyIncome) * 100) ?? 0).toFixed(1)
    );

    const labelObj =
      test.labels.find((l) => delta >= l.minDelta && delta < l.maxDelta) ??
      test.labels[1];

    const params = new URLSearchParams({
      region,
      age: String(age),
      monthly_savings: String(monthlySavings),
      monthly_income: String(monthlyIncome),
      current_savings_balance: String(currentSavings),
      gross_wealth: String(grossWealth),
      avg: String(avg),
      median: String(median),
      delta: String(delta),
      label: labelObj.label,
      savings_rate: String(savingsRate),
      advice: labelObj.advice,
    });

    router.push(`/results/${slug}?${params.toString()}`);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">{test.title}</h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">{test.intro}</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {test.inputs.map((input) => (
          <div key={input.name}>
            <label className="block mb-2 font-medium">{input.label}</label>
            {input.type === "select" && input.options ? (
              <select
                name={input.name}
                className="w-full p-2 border rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                required={input.required}
              >
                <option value="">Select …</option>
                {input.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                name={input.name}
                min={input.min}
                max={input.max}
                step={input.step}
                defaultValue={input.default as number | undefined}
                className="w-full p-2 border rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                required={input.required}
              />
            )}
          </div>
        ))}
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
    </div>
  );
}
