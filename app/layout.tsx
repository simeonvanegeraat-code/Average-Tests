import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";

const siteUrl = "https://www.humanaverage.com";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

/** Site-wide metadata */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "HumanAverage — Discover how you compare",
  description: "AI-powered quizzes and evidence-informed insights about the human average.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "HumanAverage — Discover how you compare",
    description: "AI-powered quizzes and evidence-informed insights about the human average.",
    url: siteUrl,
    siteName: "HumanAverage",
    images: ["/og-default.png"],
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5b5ff0" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsensePublisher = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  // Organization JSON-LD (lichte E-E-A-T boost)
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HumanAverage",
    url: siteUrl,
    logo: `${siteUrl}/apple-touch-icon.png`,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance preconnects for AdSense */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="" />
        <link rel="preconnect" href="https://tpc.googlesyndication.com" crossOrigin="" />

        {/* AdSense (Consent Mode v2 via Google UI) */}
        {adsensePublisher && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}`}
            crossOrigin="anonymous"
          />
        )}

        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col bg-gray-50 text-gray-800">
        {/* Accessibility: Skip link */}
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
