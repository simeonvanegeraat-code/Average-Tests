import Layout from "@/components/Layout";

export default function About() {
  return (
    <Layout title="About">
      <div className="card">
        <h2 className="text-2xl font-bold mb-2">About Average Tests</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Average Tests provides quick, modern micro-tests that compare your input with benchmark averages.
          Each result includes practical tips. Our goal is to make self-knowledge simple and useful.
        </p>
      </div>
    </Layout>
  );
}
