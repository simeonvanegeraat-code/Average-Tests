// app/take-a-test/page.tsx
import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Take a Test — HumanAverage",
  description:
    "Explore all HumanAverage quizzes. Quick, data-informed tests to discover how you compare.",
  alternates: { canonical: "https://www.humanaverage.com/take-a-test" },
  openGraph: {
    title: "Take a Test — HumanAverage",
    description:
      "Explore all HumanAverage quizzes. Quick, data-informed tests to discover how you compare.",
    url: "https://www.humanaverage.com/take-a-test",
    siteName: "HumanAverage",
    images: ["/og-default.png"],
    type: "website",
  },
};

// 🔹 Dynamisch importeren van client component
const Catalog = dynamic(() => import("./Catalog"), { ssr: false });

export default function TakeATestPage() {
  return (
    <main className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Take a Test
        </h1>
        <p className="mt-3 text-gray-600">
          Browse all quizzes. Filter, sort, and find your next 2-minute test.
        </p>
      </header>

      <Catalog />
    </main>
  );
}
