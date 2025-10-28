// src/components/Header.tsx
import Link from "next/link";
import TopicSwitcher from "@/components/TopicSwitcher";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
          <span className="text-xl">🧭</span>
          <span>Human Average</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/about" className="text-sm text-gray-700 hover:text-sky-700">About</Link>
          <Link href="/privacy" className="text-sm text-gray-700 hover:text-sky-700">Privacy</Link>
          <Link href="/terms" className="text-sm text-gray-700 hover:text-sky-700">Terms</Link>

          {/* Topic switcher */}
          <TopicSwitcher />
        </nav>
      </div>
    </header>
  );
}
