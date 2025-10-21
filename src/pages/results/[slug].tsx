import { useRouter } from "next/router";
import Layout from "@/components/Layout";

export default function ResultPage() {
  const router = useRouter();
  const query = router.query as {
    region?: string;
    age?: string;
    monthly_savings?: string;
    monthly_income?: string;
    current_savings_balance?: string;
    gross_wealth?: string;
    avg?: string;
    median?: string;
    delta?: string;
    label?: string;
    savings_rate?: string;
    advice?: string;
  };

  if (!query.region || !query.age || !query.monthly_savings || !query.avg || !query.median || !query.delta || !query.label || !query.savings_rate) {
    return <Layout title="Results"><div className="card">Invalid result data.</div></Layout>;
  }

  const monthlySavings = Number(query.monthly_savings);
  const monthlyIncome = Number(query.monthly_income ?? 0);
  const currentSavings = Number(query.current_savings_balance ?? 0);
  const grossWealth = Number(query.gross_wealth ?? 0);
  const avg = Number(query.avg);
  const median = Number(query.median);
  const delta = Number(query.delta);
  const savingsRate = Number(query.savings_rate);
  const label = query.label;
  const advice = query.advice;

  return (
    <Layout title="Your Results">
      <div className="space-y-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-2">Your Savings Snapshot</h3>
          <p>You save: <strong>€{monthlySavings}/month</strong> (~{savingsRate}% of your income)</p>
          <p>Current savings balance: <strong>€{currentSavings}</strong></p>
          <p>Estimated gross wealth: <strong>€{grossWealth}</strong></p>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-2">Benchmark for {query.region}, age {query.age}</h3>
          <p>Average monthly savings: <strong>€{avg}/month</strong></p>
          <p>Median monthly savings: <strong>€{median}/month</strong></p>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-2">{label} compared to your peers</h3>
          <p>You are {delta > 0 ? `+${delta}%` : `${delta}%`} relative to the median.</p>
          <p>{advice}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Want to improve?</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">Set a monthly savings target, review investments & wealth, revisit in 6 months.</p>
        </div>
      </div>
    </Layout>
  );
}
