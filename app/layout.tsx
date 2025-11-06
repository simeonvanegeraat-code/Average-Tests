// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Script from "next/script";

const SITE_URL = "https://www.humanaverage.com";
const ADSENSE_ID = "ca-pub-9252617114074571"; // <- jouw publisher ID

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "HumanAverage — Discover how you compare",
  description:
    "AI-powered quizzes and evidence-informed insights about the human average.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "HumanAverage — Discover how you compare",
    description:
      "AI-powered quizzes and evidence-informed insights about the human average.",
    url: SITE_URL,
    siteName: "HumanAverage",
    images: ["/og-default.png"],
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5b5ff0" }],
  },
  manifest: "/manifest.webmanifest",
  // Helpt AdSense detectie
  other: { "google-adsense-account": ADSENSE_ID },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HumanAverage",
    url: SITE_URL,
    logo: `${SITE_URL}/apple-touch-icon.png`,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Consent Mode v2: alles denied totdat gebruiker kiest */}
        <Script id="consent-defaults" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              functionality_storage: 'granted',
              security_storage: 'granted',
              wait_for_update: 500
            });
            window.gtag = gtag;
          `}
        </Script>

        {/* Preconnects */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="" />
        <link rel="preconnect" href="https://tpc.googlesyndication.com" crossOrigin="" />

        {/* Verplichte meta voor AdSense */}
        <meta name="google-adsense-account" content={ADSENSE_ID} />

        {/* Funding Choices (Google CMP) – toont cookiebanner in EEA/UK/CH */}
        <Script
          id="google-funding-choices"
          strategy="afterInteractive"
          async
          src={`https://fundingchoicesmessages.google.com/i/${ADSENSE_ID.replace(
            "ca-",
            "pub-"
          )}?ers=1`}
        />

        {/* AdSense Auto Ads loader (laadt na consent) */}
        <Script
          id="adsense-lib"
          strategy="afterInteractive"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          crossOrigin="anonymous"
        />

        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>

      <body className="font-sans min-h-screen flex flex-col bg-gray-50 text-gray-800">
        {/* Skip link for a11y */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-white border rounded px-3 py-2 shadow"
        >
          Skip to content
        </a>

        <Header />
        <main id="main" className="flex-1 max-w-5xl mx-auto w-full p-6">
          {children}
        </main>

        <footer className="text-center text-sm text-gray-500 p-6 border-t bg-white">
          © {new Date().getFullYear()} HumanAverage ·{" "}
          <a href="/editorial-policy" className="ml-1 underline-offset-2 hover:underline">
            Editorial
          </a>{" "}
          ·{" "}
          <a href="/corrections" className="ml-1 underline-offset-2 hover:underline">
            Corrections
          </a>{" "}
          ·{" "}
          <a href="/privacy" className="ml-1 underline-offset-2 hover:underline">
            Privacy
          </a>{" "}
          ·{" "}
          <a href="/contact" className="ml-1 underline-offset-2 hover:underline">
            Contact
          </a>
        </footer>
      </body>
    </html>
  );
}
