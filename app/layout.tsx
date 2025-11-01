// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

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
    type: "website"
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large"
  },
  other: {
    // Helpt browsers met kleurenschema
    "color-scheme": "light",
    // Zorgt dat telefoon-nummers niet als link worden gestyled op iOS
    "format-detection": "telephone=no"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsensePublisher = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance: preconnects voor AdSense */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="" />
        <link rel="preconnect" href="https://tpc.googlesyndication.com" crossOrigin="" />

        {/* AdSense + CMP (Google CMP vanuit AdSense gebruikt deze automatisch) */}
        {adsensePublisher && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}`}
            crossOrigin="anonymous"
          />
        )}
      </head>

      <body className="font-sans min-h-screen flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
            <a href="/" className="text-xl font-bold" aria-label="HumanAverage Home">
              HumanAverage
            </a>
            <nav className="space-x-4 text-gray-600" aria-label="Primary">
              <a href="/" className="hover:text-black">Home</a>
              <a href="/polls" className="hover:text-black">Polls</a>
              <a href="/about" className="hover:text-black">About</a>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto p-6">
          {children}
        </main>

        <footer className="text-center text-sm text-gray-500 p-6 border-t">
          © {new Date().getFullYear()} HumanAverage ·{" "}
          <a href="/editorial-policy" className="ml-1 underline-offset-2 hover:underline">Editorial</a> ·{" "}
          <a href="/corrections" className="ml-1 underline-offset-2 hover:underline">Corrections</a> ·{" "}
          <a href="/contact" className="ml-1 underline-offset-2 hover:underline">Contact</a>
        </footer>
      </body>
    </html>
  );
}
