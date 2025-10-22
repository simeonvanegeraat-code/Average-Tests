import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "@/components/Layout";
import categories from "@/data/categories.json";
import CategoryPage from "@/components/CategoryPage";
import SEOIntroMoney from "@/components/SEOIntroMoney";
import FAQ from "@/components/FAQ";

type Cat = {
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  dataFile: string;
};

const moneyFaq = [
  {
    q: "What is a good savings rate?",
    a: "Personal finance guides often recommend 10–20% of disposable income, but your ideal rate depends on income stability, debt, and goals. Our page shows typical mean and median savings rates for context."
  },
  {
    q: "Why do you show median as well as mean?",
    a: "Median better represents the typical household because a small number of very high earners can push the mean up. Seeing both gives a fairer picture."
  },
  {
    q: "Where do these numbers come from?",
    a: "We use official sources such as Eurostat for saving rates and income, and the ECB HFCS for wealth distribution. Each card links to the underlying source."
  }
];

export default function CategorySlugPage() {
  const { query, isReady } = useRouter();
  const { slug } = query as { slug?: string };

  if (!isReady) {
    return (
      <Layout title="Category">
        <div className="card p-6">Loading…</div>
      </Layout>
    );
  }

  const cat = (categories as Cat[]).find((c) => c.slug === slug);

  if (!cat) {
    return (
      <Layout title="Not found">
        <div className="card p-6">Category not found.</div>
      </Layout>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const stats = require(`@/data/averages/${cat.dataFile}`);

  const intro =
    slug === "money" ? (
      <SEOIntroMoney />
    ) : (
      <div>
        <h2 className="text-xl font-bold mb-2">{cat.title}</h2>
        <p className="text-gray-700">
          Browse typical values and distributions for this topic. We include both mean and median where possible, with links to official sources.
        </p>
      </div>
    );

  const ctaHref = slug === "money" ? "/test/global-monthly-savings-plus-wealth" : undefined;
  const ctaLabel = slug === "money" ? "Take the savings test" : "Take the test";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://humanaverage.com/" },
      { "@type": "ListItem", "position": 2, "name": cat.title, "item": `https://humanaverage.com/category/${slug}` }
    ]
  };

  const faqLd =
    slug === "money"
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": moneyFaq.map((x) => ({
            "@type": "Question",
            "name": x.q,
            "acceptedAnswer": { "@type": "Answer", "text": x.a }
          }))
        }
      : null;

  return (
    <Layout title={cat.title} description={cat.subtitle}>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /> : null}
      </Head>

      <CategoryPage
        title={cat.title}
        subtitle={cat.subtitle}
        emoji={cat.emoji}
        stats={stats}
        intro={intro}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
      />

      {slug === "money" ? <div className="mt-8"><FAQ items={moneyFaq} /></div> : null}
    </Layout>
  );
}
