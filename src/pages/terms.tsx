import Head from "next/head";

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service • Human Average</title>
        <meta
          name="description"
          content="Human Average terms of service: acceptable use, intellectual property, disclaimers, liability and contact."
        />
      </Head>

      <main className="container py-10 space-y-8">
        <header className="card p-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Please read these terms carefully before using the site.</p>
        </header>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">1) Agreement</h2>
          <p>
            By accessing or using Human Average (“Service”), you agree to these Terms and our Privacy Policy. If you
            do not agree, please do not use the Service.
          </p>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">2) Use of the Service</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>You may browse the site and use interactive tests for personal, non-commercial purposes.</li>
            <li>Do not misuse the Service, attempt to break security, or scrape at a rate that harms availability.</li>
            <li>We may modify, suspend, or discontinue features at any time.</li>
          </ul>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">3) Content &amp; intellectual property</h2>
          <p>
            Layout, design, and original copy are owned by Human Average. Aggregated statistics remain the property of
            their respective sources. You may quote short excerpts with a link and attribution.
          </p>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">4) No professional advice</h2>
          <p>
            The Service provides general information and benchmarks only. It is not financial, legal, medical or
            professional advice. Make your own decisions or consult a qualified professional.
          </p>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">5) Disclaimers</h2>
          <p>
            The Service is provided “as is”. We do not warrant accuracy, completeness, or availability, and we may rely
            on third-party data that can change.
          </p>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">6) Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Human Average and its owner shall not be liable for any indirect,
            incidental, special or consequential damages, or for loss of profits, data or use, arising from or related
            to your use of the Service.
          </p>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">7) Third-party services</h2>
          <p>
            We use third-party services such as analytics and advertising. Your use of those is subject to their terms,
            including Google’s terms for AdSense.
          </p>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">8) Changes</h2>
          <p>We may update these Terms from time to time. Continued use means you accept the updated Terms.</p>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">9) Contact</h2>
          <p>Questions? Email <a className="underline" href="mailto:firenature23@gmail.com">firenature23@gmail.com</a></p>
        </section>

        <p className="text-xs text-gray-500">Effective date: 2025-10-22</p>
      </main>
    </>
  );
}
