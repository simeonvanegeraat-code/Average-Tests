"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

type NavItem = { href: string; label: string; match?: "exact" | "startsWith" };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", match: "exact" },
  { href: "/take-a-test", label: "Take a Test", match: "startsWith" },
  { href: "/insights", label: "Insights", match: "startsWith" },
  // polls verwijderd
  { href: "/about", label: "About", match: "startsWith" },
  { href: "/privacy", label: "Privacy", match: "startsWith" },
  { href: "/contact", label: "Contact", match: "startsWith" },
];

function isActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function NavLink({
  item,
  pathname,
  onClick,
  className = "",
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
  className?: string;
}) {
  const active = isActive(pathname, item);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "transition",
        active
          ? "text-gray-900 font-semibold underline underline-offset-4 decoration-indigo-500"
          : "text-gray-600 hover:text-black",
        className,
      ].join(" ")}
    >
      {item.label}
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-gray-900 hover:text-black transition"
          aria-label="HumanAverage Home"
        >
          HumanAverage
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.slice(0, 3).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}

          <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />

          {NAV_ITEMS.slice(3).map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}

        {/* CTA */}
          <Link
            href="/take-a-test"
            className="ml-2 inline-flex items-center rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-700 transition"
          >
            Start a quiz
            <span aria-hidden className="ml-1">→</span>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded hover:bg-gray-100"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav
          id="mobile-nav"
          className="md:hidden border-t border-gray-200 bg-white px-4 pb-4"
        >
          <ul className="flex flex-col space-y-3 mt-3 text-gray-700 font-medium">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  pathname={pathname}
                  onClick={() => setOpen(false)}
                  className="block py-1"
                />
              </li>
            ))}
            <li className="pt-1">
              <Link
                href="/take-a-test"
                onClick={() => setOpen(false)}
                className="block text-center rounded-lg bg-indigo-600 text-white px-4 py-2 font-medium hover:bg-indigo-700 transition"
              >
                Start a quiz
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
