import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const config = {
  // Compilează pachetele interne din monorepo (sursă TS, fără build separat)
  transpilePackages: ["@tradegx/core", "@tradegx/ui-tokens", "@tradegx/config", "@tradegx/api-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Anti-clickjacking (site-ul nu se încarcă în iframe-uri străine).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // HTTPS forțat 2 ani, inclusiv subdomenii — semnal puternic anti-phishing.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
