// app/privacy/page.tsx
export const metadata = {
  title: "Privacy & Cookies • HumanAverage",
  description:
    "Privacy- en cookiebeleid van HumanAverage, inclusief informatie over Google AdSense en consent management (Consent Mode v2).",
  alternates: { canonical: "https://www.humanaverage.com/privacy" },
};

export default function PrivacyPage() {
  const email = "firenature23@gmail.com";
  const lastUpdated = "November 1, 2025";

  return (
    <main className="max-w-4xl mx-auto grid gap-6 py-10 px-6">
      {/* Intro */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy & Cookies Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {lastUpdated}</p>
        <p className="mt-4 text-gray-700">
          HumanAverage (“we”, “our”, “us”) respects your privacy. This page explains what data we process,
          how cookies and similar technologies are used, and what choices you have.
        </p>
      </section>

      {/* Advertising */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Advertising & Google AdSense</h2>
        <p className="mt-3 text-gray-700">
          We display ads using <strong>Google AdSense</strong>. In the EEA/UK/CH we use Google’s
          <strong> Consent Management Platform (CMP)</strong> and <strong>Consent Mode v2</strong>. Depending on
          the consent you give, Google may show personalized or non-personalized ads.
        </p>
        <p className="mt-3">
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Learn more about Google’s advertising technologies
          </a>
          .
        </p>
        <p className="mt-3 text-gray-700">
          Our ads.txt file is available at{" "}
          <a href="/ads.txt" className="underline hover:no-underline">
            /ads.txt
          </a>
          .
        </p>
      </section>

      {/* Consent */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Consent Management</h2>
        <p className="mt-3 text-gray-700">
          On your first visit you may see a consent banner powered by Google’s CMP. You can change or withdraw
          your choices at any time. If you’d like to review your consent again, use your browser’s privacy controls
          or revisit this page after clearing site data.
        </p>
        <ul className="mt-3 list-disc pl-6 text-gray-700">
          <li>Personalized ads (if granted) may use cookies or local storage.</li>
          <li>Without consent, non-personalized ads may still appear using contextual information.</li>
        </ul>
      </section>

      {/* Analytics (optional text; safe even if GA4 is nog niet actief) */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="mt-3 text-gray-700">
          We may use privacy-friendly analytics to understand site usage and improve content. In the EEA/UK/CH,
          analytics only runs after consent is granted via Consent Mode v2. IP anonymization is enabled where applicable.
        </p>
      </section>

      {/* Data & rights */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Your Choices & Rights</h2>
        <ul className="mt-3 list-disc pl-6 text-gray-700">
          <li>Change cookie/consent preferences (via the banner or your browser settings).</li>
          <li>Block or delete cookies in your browser.</li>
          <li>Contact us for questions about this policy or your data.</li>
        </ul>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Contact</h2>
        <p className="mt-3 text-gray-700">
          Questions about this policy? Email{" "}
          <a href={`mailto:${email}`} className="underline hover:no-underline">
            {email}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
