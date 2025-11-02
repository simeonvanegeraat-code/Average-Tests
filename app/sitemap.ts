// app/sitemap.ts
import { MetadataRoute } from "next";
import { QUIZZES } from "@/lib/quizzes";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.humanaverage.com";

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/privacy",
    "/contact",
    "/polls",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const quizPages: MetadataRoute.Sitemap = QUIZZES.flatMap((quiz) => [
    {
      url: `${baseUrl}/quiz/${quiz.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/quiz/${quiz.slug}/result`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ]);

  return [...staticPages, ...quizPages];
}
