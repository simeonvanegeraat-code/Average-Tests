type Props = {
  value: number;
  avg: number;
  delta: number;
  label: string;
  advice?: string;
  unit?: string;
};

export default function ResultCard({ value, avg, delta, label, advice, unit = "" }: Props) {
  const sign = delta > 0 ? "+" : "";
  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-2">Your result</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60">
          <div className="text-sm text-gray-500">You</div>
          <div className="text-2xl font-bold">{value}{unit}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60">
          <div className="text-sm text-gray-500">Average</div>
          <div className="text-2xl font-bold">{avg}{unit}</div>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60">
          <div className="text-sm text-gray-500">Difference</div>
          <div className="text-2xl font-bold">{sign}{delta}{unit}</div>
          <div className="mt-1 inline-flex px-2 py-1 rounded-lg text-xs font-medium
            bg-blue-600/10 text-blue-700 dark:text-blue-300 dark:bg-blue-500/20">
            {label}
          </div>
        </div>
      </div>
      {advice && (
        <p className="text-sm text-gray-700 dark:text-gray-300">{advice}</p>
      )}
    </div>
  );
}
