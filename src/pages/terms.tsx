import Layout from "@/components/Layout";

export default function Terms() {
  return (
    <Layout title="Terms of Service">
      <div className="card">
        <h2 className="text-2xl font-bold mb-2">Terms of Service</h2>
        <p className="text-gray-700 dark:text-gray-300">
          This website is provided “as is.” Results are estimates for personal insight and not professional advice.
          By using this site, you agree to our terms and privacy policy.
        </p>
      </div>
    </Layout>
  );
}
