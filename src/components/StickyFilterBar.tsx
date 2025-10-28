"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ContinentSelector from "@/components/ContinentSelector";
import AgeSelector from "@/components/AgeSelector";

/**
 * Smalle, sticky filterbalk die altijd zichtbaar blijft.
 * Tikken opent een eenvoudige bottom sheet met de 2 selectors.
 */
export default function StickyFilterBar() {
  const router = useRouter();
  const continent = (router.query.continent as string) || "Global";
  const age = (router.query.age as string) || "18-24";
  const [open, setOpen] = useState(false);

  // Zorg dat defaults in de URL staan (voor shareable links).
  useEffect(() => {
    if (!router.isReady) return;
    if (!router.query.continent || !router.query.age) {
      router.replace(
        { pathname: router.pathname, query: { ...router.query, continent, age } },
        undefined,
        { shallow: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return (
    <>
      {/* Sticky mini bar */}
      <div className="sticky top-0 z-30 -mx-4 sm:mx-0 mb-2">
        <div className="mx-auto max-w-5xl px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full h-11 rounded-full border border-gray-200 bg-white/95 backdrop-blur text-sm flex items-center justify-between px-4 shadow-sm hover:shadow transition"
            aria-label="Open filters"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                🌍 {continent}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                👤 {age}
              </span>
            </div>
            <span className="text-gray-500">Filteren</span>
          </button>
        </div>
      </div>

      {/* Bottom sheet (pure CSS/JS, geen deps) */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Sheet */}
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Filters</h3>
              <button
                onClick={() => setOpen(false)}
                className="h-8 px-3 rounded-full border border-gray-300 text-sm"
              >
                Klaar
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  <span>🌍</span> Continent
                </span>
                <ContinentSelector />
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  <span>👤</span> Age
                </span>
                <AgeSelector />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
