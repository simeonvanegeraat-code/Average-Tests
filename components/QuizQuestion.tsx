// components/QuizQuestion.tsx
"use client";

type Option = { id: string; label: string; weight: number };

export default function QuizQuestion({
  prompt,
  options,
  value,
  onChange,
}: {
  prompt: string;
  options: Option[];
  value?: string; // selected option id
  onChange: (opt: Option) => void;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <p className="font-semibold text-gray-900 mb-4">{prompt}</p>
      <div className="space-y-2">
        {options.map((opt) => {
          const checked = value === opt.id;
          return (
            <label
              key={opt.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                ${checked ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <input
                type="radio"
                className="accent-indigo-600"
                name={prompt}
                checked={checked}
                onChange={() => onChange(opt)}
              />
              <span className="text-gray-800">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
