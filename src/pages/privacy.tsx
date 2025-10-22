import Head from "next/head";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy • Human Average</title>
        <meta
          name="description"
          content="How Human Average handles your data: what we collect, how we use it, your choices, and how to contact us."
        />
      </Head>

      <main className="container py-10 space-y-8">
        <header className="card p-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">We respect your privacy and keep things simple and transparent.</p>
        </header>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Who we are</h2>
          <p><strong>Human Average</strong> (“we”, “us”, “our”). Contact: <a className="underline" href="mailto:firenature23@gmail.com">firenature23@gmail.com</a></p>
          <p>We act as the data controller for information processed on this website.</p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">What we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Website analytics:</strong> page views, device info, approximate location (from IP),
              and interactions. Used in aggregate to improve the site. We prefer privacy-friendly settings whenever possible.
            </li>
            <li>
              <strong>Ad technology (Google AdSense):</strong> if you consent through our CMP, ad partners may set cookies or use unique identifiers to show and measure ads.
            </li>
            <li>
              <strong>Test inputs:</strong> numbers you type into on-site tests (e.g., monthly savings)
              are processed in your browser to show results. We don’t need names or sensitive data.
            </li>
            <li>
              <strong>Contact:</strong> if you email us, we’ll receive your email address and message.
            </li>
          </ul>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Why we use your data</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Provide the service:</strong> load pages, render charts, run tests.</li>
            <li><strong>Improve the service:</strong> aggregate analytics to understand performance and content quality.</li>
            <li><strong>Monetize:</strong> display ads via Google AdSense, subject to your consent where required.</li>
            <li><strong>Security:</strong> detect abuse and keep the site reliable.</li>
          </ul>
          <p>Legal bases depend on your location: consent (ads/cookies in the EEA/UK), legitimate interests (basic analytics and security), and performance of a service.</p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Ads, cookies &amp; consent</h2>
          <p>
            We use <strong>Google AdSense</strong>. In regions where consent is required, a
            <strong> Consent Management Platform (CMP)</strong> will ask for your preferences before setting non-essential cookies.
            You can revisit choices any time via the banner or a “Privacy” link in the footer.
          </p>
          <p>
            Google’s use of data is described in{" "}
            <a className="underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
              Google’s Advertising page
            </a>. Our ads.txt / app-ads.txt files (where applicable) are served from the site root for authorization.
          </p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Data retention</h2>
          <p>We keep analytics data only as long as needed for trend analysis and site reliability; email correspondence is retained as required for support and legal obligations.</p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Your rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct, delete or restrict processing, to object, and to data portability.
            You can withdraw ad/analytics consent at any time via the CMP.
          </p>
          <p>To make a request, email <a className="underline" href="mailto:firenature23@gmail.com">firenature23@gmail.com</a>. We’ll respond within a reasonable timeframe.</p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Children</h2>
          <p>The site is intended for users aged 13+. We don’t knowingly collect personal data from children.</p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">International transfers</h2>
          <p>Our providers may operate globally. We rely on standard contractual safeguards and reputable vendors.</p>
        </section>

        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Changes</h2>
          <p>We may update this policy to reflect product or legal changes. We’ll post the new date below and, when significant, provide notice.</p>
        </section>

        <section className="card p-6 space-y-2">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p>Email: <a className="underline" href="mailto:firenature23@gmail.com">firenature23@gmail.com</a></p>
        </section>

        <p className="text-xs text-gray-500">Effective date: 2025-10-22</p>
      </main>
    </>
  );
}
