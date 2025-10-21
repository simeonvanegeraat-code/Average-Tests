import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import TestRunner from "@/components/TestRunner";
import tests from "@/data/tests";

export default function TestPage() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  const test = (tests as any[]).find(t => t.slug === slug);

  if (!slug || !test) {
    return <Layout title="Test not found"><div className="card">Test not found.</div></Layout>;
  }

  return (
    <Layout title={test.seo?.title || test.title} description={test.seo?.description}>
      <TestRunner slug={slug} />
    </Layout>
  );
}
