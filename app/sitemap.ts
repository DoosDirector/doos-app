import type { MetadataRoute } from "next"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://doos.app"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:             `${APP_URL}/`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        1,
    },
    {
      url:             `${APP_URL}/auth/sign-in`,
      lastModified:    new Date(),
      changeFrequency: "yearly",
      priority:        0.3,
    },
  ]
}
