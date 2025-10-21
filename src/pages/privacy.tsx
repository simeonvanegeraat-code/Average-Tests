import Layout from "@/components/Layout";

export default function Privacy() {
  return (
    <Layout title="Privacy Policy">
      <div className="card">
        <h2 className="text-2xl font-bold mb-2">Privacy Policy</h2>
        <p className="text-gray-700 dark:text-gray-300">
          We don’t require accounts for basic tests. Inputs are processed client-side, and we may use
          pseudonymous analytics to improve features. For ads, please refer to the provider’s policies.
        </p>
      </div>
    </Layout>
  );
}
