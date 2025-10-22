// src/components/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:opacity-90">
          <span className="text-lg">🧭</span>
          <span>Human Average</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/about" className="hover:text-sky-700">About</Link>
          <Link href="/privacy" className="hover:text-sky-700">Privacy</Link>
          <Link href="/terms" className="hover:text-sky-700">Terms</Link>
        </nav>
      </div>
    </header>
  );
}
