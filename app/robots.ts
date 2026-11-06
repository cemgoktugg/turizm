import type { MetadataRoute } from "next";

import { SITE_URL as BASE } from "@/lib/site-url";

// Alan adı çalışma anında okunur (SITE_URL)
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/satis", "/satis/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
