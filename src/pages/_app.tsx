// src/pages/_app.tsx
import type { AppProps } from "next/app";
import "@/styles/globals.css";
import Header from "@/components/Header";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900">
      {/* Vast navigatiegedeelte */}
      <Header />

      {/* Hoofdcontent gecentreerd */}
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <Component {...pageProps} />
      </main>

      {/* Footer (optioneel, je kunt hem later uitbreiden) */}
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Human Average · All rights reserved
      </footer>
    </div>
  );
}
