import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export default function Layout({ title = "Human Average", description = "Explore trusted averages across topics.", children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(document.documentElement.classList.contains("dark") || prefers);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", dark);
  }, [mounted, dark]);

  return (
    <>
      <Head>
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
      </Head>

      <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-900">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-extrabold tracking-tight">
              <span className="inline-flex items-center gap-2">
                {/* Accent pill */}
                <span className="h-6 w-6 rounded-full bg-gradient-to-br from-teal-400 via-sky-400 to-cyan-400" />
                Human Average
              </span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/about" className="hover:text-gray-700 dark:hover:text-gray-200">About</Link>
              <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-200">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-200">Terms</Link>
              <button
                onClick={() => setDark((v) => !v)}
                className="h-8 px-3 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {dark ? "🌙" : "☀️"}
              </button>
            </div>
          </nav>
        </header>

        {/* Page */}
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">{children}</main>

        <footer className="mt-12 border-t border-gray-100 dark:border-gray-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-gray-500">
            © {new Date().getFullYear()} Human Average
          </div>
        </footer>
      </div>
    </>
  );
}
