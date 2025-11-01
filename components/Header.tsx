"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);

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
        <nav className="hidden md:flex space-x-6 text-gray-600 font-medium">
          <Link href="/" className="hover:text-black transition">
            Home
          </Link>
          <Link href="/polls" className="hover:text-black transition">
            Polls
          </Link>
          <Link href="/about" className="hover:text-black transition">
            About
          </Link>
          <Link href="/privacy" className="hover:text-black transition">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-black transition">
            Contact
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="md:hidden border-t border-gray-200 bg-white px-4 pb-4">
          <ul className="flex flex-col space-y-3 mt-3 text-gray-700 font-medium">
            <li>
              <Link href="/" onClick={() => setOpen(false)} className="block hover:text-black">
                Home
              </Link>
            </li>
            <li>
              <Link href="/polls" onClick={() => setOpen(false)} className="block hover:text-black">
                Polls
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={() => setOpen(false)} className="block hover:text-black">
                About
              </Link>
            </li>
            <li>
              <Link href="/privacy" onClick={() => setOpen(false)} className="block hover:text-black">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/contact" onClick={() => setOpen(false)} className="block hover:text-black">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
