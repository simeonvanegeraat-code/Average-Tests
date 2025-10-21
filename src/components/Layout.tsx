import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";

type Props = { title?: string; description?: string; children: ReactNode; };

export default function Layout({ title, description, children }: Props) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const stored = (localStorage.getItem("theme") as "light" | "dark" | null);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    root.classList.remove("light", "dark");
    root.classList.add(initial);
    setTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  const metaTitle = title ? `${title} | Average Tests` : "Average Tests";
  const metaDesc = description ?? "Find out how average you really are — quick interactive tests with clean insights.";

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="robots" content="max-image-preview:large" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="container flex items-center justify-between py-3 px-4">
            <Link href="/" className="text-xl font-bold tracking-tight">Average Tests</Link>
            <nav className="flex items-center gap-4">
              <Link href="/about" className="link">About</Link>
              <Link href="/privacy" className="link">Privacy</Link>
              <Link href="/terms" className="link">Terms</Link>
              <button onClick={toggleTheme} className="btn btn-primary">Toggle theme</button>
            </nav>
          </div>
        </header>

        <main className="container flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-gray-200 dark:border-gray-800">
          <div className="container px-4 py-6 text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Average Tests — All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
