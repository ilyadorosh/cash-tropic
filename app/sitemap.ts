import { MetadataRoute } from "next";
import { Redis } from "@upstash/redis";

const BASE_URL = "https://cash-tropic.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/conversations`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];

  try {
    const redis = Redis.fromEnv();
    const userKeys = await redis.keys("userCache:*");

    const userRoutes: MetadataRoute.Sitemap = userKeys.map((key: string) => {
      const username = key.replace("userCache:", "");
      return {
        url: `${BASE_URL}/user/${encodeURIComponent(username)}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    });

    return [...static_routes, ...userRoutes];
  } catch {
    return static_routes;
  }
}
