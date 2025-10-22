import fs from "fs";
import path from "path";
import { GetServerSideProps } from "next";

const BASE_URL = "https://www.humanaverage.com";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // --- Detect existing data categories (money, income, etc.) ---
  const averagesDir = path.join(process.cwd(), "src", "data", "averages");
  const categories = fs
    .readdirSync(averagesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));

  // --- Static and info pages ---
  const staticPages = [
    "",
    "/about",
    "/privacy",
    "/terms",
  ];

  // --- Category pages ---
  const categoryPages = categories.map((slug) => `/category/${slug}`);

  // --- (Optional) test pages ---
  const testPages = [
    "/test/savings",
  ];

  // --- Combine all URLs ---
  const urls = [...staticPages, ...categoryPages, ...testPages];

  const today = new Date().toISOString();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
  >
    ${urls
      .map(
        (path) => `
      <url>
        <loc>${BASE_URL}${path}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>${
          path === ""
            ? "daily"
            : path.startsWith("/category")
            ? "weekly"
            : path.startsWith("/test")
            ? "monthly"
            : "yearly"
        }</changefreq>
        <priority>${
          path === ""
            ? "1.0"
            : path.startsWith("/category")
            ? "0.8"
            : path.startsWith("/test")
            ? "0.6"
            : "0.4"
        }</priority>
      </url>`
      )
      .join("")}
  </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function SiteMap() {
  return null;
}
