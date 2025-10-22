// src/components/SEOIntroMoney.tsx
export default function SEOIntroMoney() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Average savings and net wealth by age and region</h2>
      <p className="text-gray-700">
        On this page you’ll find <strong>average monthly savings</strong>, the <strong>median savings rate</strong> and snapshots of
        <strong> net household wealth</strong>. We show both <strong>mean</strong> and <strong>median</strong> so you get a fair picture that isn’t skewed by a few very high earners.
        Use these benchmarks to understand how typical households in Europe manage their money and how savings grow over time.
      </p>

      <h3 className="mt-4 font-semibold">Why this matters</h3>
      <ul className="list-disc pl-5 mt-2 text-gray-700 space-y-1">
        <li>Compare typical <strong>monthly savings</strong> for your age group and region.</li>
        <li>See how a <strong>savings rate</strong> turns income into long-term <strong>net wealth</strong>.</li>
        <li>Understand the value of a <strong>median</strong> when averages are distorted by outliers.</li>
      </ul>

      <h3 className="mt-4 font-semibold">Method and sources</h3>
      <p className="text-gray-700">
        Benchmarks are compiled from official statistics such as <strong>Eurostat</strong> (household saving rate and income)
        and the <strong>ECB Household Finance and Consumption Survey (HFCS)</strong> for wealth distributions. Where needed we derive monthly amounts from saving rates and disposable income.
        Always check the source link under each card for details and year.
      </p>
    </div>
  );
}
