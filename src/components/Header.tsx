import Link from "next/link";
import { useRouter } from "next/router";
import TopicsNav from "@/components/TopicsNav";

export default function Header() {
  const router = useRouter();
  const onCategory = router.pathname.startsWith("/category/");

  return (
    <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
      {/* Topbar */}
      <div className="container">
        <div className="flex items-center justify-between py-3">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Human Average – Home"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/50 via-cyan-400/50 to-sky-400/50 border border-gray-200 select-none">
              📊
            </span>
            <span className="font-extrabold tracking-tight text-lg">Human Average</span>
          </Link>

          {/* Primary nav */}
          <nav aria-label="Primary">
            <ul className="flex items-center gap-3 text-sm">
              <li>
                <Link href="/about" className="px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                  Terms
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Collapsible Topics – default dicht; toon overal (ook Home) */}
      <div className="container pb-3">
        <TopicsNav onlyOnCategoryPages={false} defaultOpen={false} />
      </div>

      {onCategory ? <div className="border-t border-gray-200" /> : null}
    </header>
  );
}
