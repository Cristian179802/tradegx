import type { MetadataRoute } from "next";

// Robots — semnal de legitimitate + protecția zonelor private.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/settings", "/trades", "/accounts"],
      },
    ],
    sitemap: "https://www.tradegx.com/sitemap.xml",
  };
}
