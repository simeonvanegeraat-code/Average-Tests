import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HumanAverage — Discover how you compare",
  description: "AI-powered quizzes and polls about the human average.",
  openGraph: {
    title: "HumanAverage — Discover how you compare",
    description: "AI-powered quizzes and polls about the human average.",
    url: "https://www.humanaverage.com",
    siteName: "HumanAverage",
    images: ["/og-default.png"],
    type: "website"
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsensePublisher = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en">
      <head>
        {adsensePublisher && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}`}
            crossOrigin="anonymous"
          ></script>
        )}
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
            <a href="/" className="text-xl font-bold">HumanAverage</a>
            <nav className="space-x-4 text-gray-600">
              <a href="/" className="hover:text-black">Home</a>
              <a href="/polls" className="hover:text-black">Polls</a>
              <a href="/about" className="hover:text-black">About</a>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto p-6">{children}</main>
        <footer className="text-center text-sm text-gray-500 p-6 border-t">
          © {new Date().getFullYear()} HumanAverage ·
          <a href="/editorial-policy" className="ml-2">Editorial</a> ·
          <a href="/corrections" className="ml-2">Corrections</a> ·
          <a href="/contact" className="ml-2">Contact</a>
        </footer>
      </body>
    </html>
  );
}
