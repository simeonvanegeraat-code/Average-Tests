import { useRouter } from "next/router";
import tests from "@/data/tests";

type InputConfig = {
  type: "number" | "range";
  name: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  default?: number;
};

type LabelBand = {
  minDelta: number;
  maxDelta: number;
  label: string;
  advice?: string;
};

type Bucket = { min: number; max: number; avg: number };

type TestConfig = {
  slug: string;
  title: string;
  metric: string;
  unit?: string;
  intro: string;
  inputs: InputConfig[];
  age_buckets?: Bucket[];
  value_buckets?: Bucket[];
  labels: LabelBand[];
  heroImage?: string;
  seo?: { title?: string; description?: string };
};

export default function TestRunner({ slug }: { slug: string }) {
  const router = useRouter();
  const test = (tests as TestConfig[]).find(t => t.slug === slug);

  if (!test) return <div className="card">Test not found.</div>;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ageStr = fd.get("age") as string | null;
    const age = ageStr ? Number(ageStr) : NaN;
    const value = Number(fd.get("value"));

    let avg = 0;
    if (test.age_buckets && !Number.isNaN(age)) {
      const bucket = test.age_buckets.find(b => age >= b.min && age <= b.max) ?? test.age_buckets[0];
      avg = bucket.avg;
    } else if (test.value_buckets) {
      const vb = test.value_buckets.find(b => value >= b.min && value <= b.max) ?? test.value_buckets[0];
      avg = vb.avg;
    }

    const delta = Number((value - avg).toFixed(1));
    const labelObj = test.labels.find(l => delta >= l.minDelta && delta < l.maxDelta) ?? test.labels[Math.floor(test.labels.length / 2)];
    const params = new URLSearchParams({
      value: String(value),
      avg: String(avg),
      delta: String(delta),
      label: labelObj.label
    });
    router.push(`/results/${slug}?${params.toString()}`);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-2">{test.title}</h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">{test.intro}</p>
      <form onSubmit={onSubmit} className="space-y-5">
        {test.inputs.map((input) => (
          <div key={input.name}>
            <label className="block mb-2 font-medium">{input.label}</label>
            {input.type === "range" ? (
              <input
                type="range"
                name={input.name}
                min={input.min}
                max={input.max}
                step={input.step ?? 1}
                defaultValue={input.default ?? input.min}
                className="w-full"
              />
            ) : (
              <input
                type="number"
                name={input.name}
                min={input.min}
                max={input.max}
                step={input.step ?? 1}
                defaultValue={input.default ?? ""}
                className="w-full p-2 border rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                required
              />
            )}
          </div>
        ))}
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
}
