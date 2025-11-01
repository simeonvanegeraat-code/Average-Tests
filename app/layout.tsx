import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

const siteUrl = "https://www.humanaverage.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "HumanAverage — Discover how you compare",
  description: "AI-powered quizzes and polls about the human average.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "HumanAverage — Discover how you compare",
    description: "AI-powered quizzes and polls about the human average.",
    url: siteUrl,
    siteName: "HumanAverage",
    images: ["/og-default.png"],
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsensePublisher = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance preconnects for AdSense */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="" />
        <link rel="preconnect" href="https://tpc.googlesyndication.com" crossOrigin="" />

        {/* Google AdSense script (CMP handled automatically by Google) */}
        {adsensePublisher && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="font-sans min-h-screen flex flex-col bg-gray-50 text-gray-800">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6">{children}</main>
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
