import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";

const SEO = {
  ro: {
    title: "TradeGX — Jurnal de Trading Profesional",
    description:
      "Jurnalul de trading profesional pentru traderii SMC și ICT. Urmărește performanța, jurnalizează fiecare setup și lasă AI-ul să îți identifice edge-ul.",
    ogDescription: "Jurnalul de trading profesional pentru traderii SMC și ICT.",
    twitterDescription: "Jurnal de trading profesional cu AI Coach",
    ogLocale: "ro_RO",
    keywords: [
      "jurnal de trading",
      "jurnal trading românesc",
      "trading journal",
      "analiză trading SMC",
      "ICT trading România",
      "AI coach trading",
      "prop firm FTMO",
      "backtesting strategii forex",
      "calculator lot forex",
      "academie trading română",
    ],
  },
  en: {
    title: "TradeGX — Professional Trading Journal",
    description:
      "The professional trading journal for SMC and ICT traders. Track performance, journal every setup and let AI pinpoint your edge.",
    ogDescription: "The professional trading journal for SMC and ICT traders.",
    twitterDescription: "Professional trading journal with an AI Coach",
    ogLocale: "en_US",
    keywords: [
      "trading journal",
      "SMC trading analytics",
      "ICT trading",
      "AI trading coach",
      "prop firm FTMO journal",
      "forex backtesting",
      "forex lot calculator",
      "trading academy",
    ],
  },
} as const;

// Tipografie de brand: Inter pentru text, Space Grotesk pentru titluri/cifre.
// latin-ext e obligatoriu pentru diacriticele românești (ă â î ș ț).
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

// Metadata pe limbă — titlul/OG/keywords urmează cookie-ul de locale,
// astfel vizitatorii EN primesc SEO în engleză (nu fallback românesc).
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) === "en" ? "en" : "ro";
  const seo = SEO[locale];
  return {
    title: {
      default: seo.title,
      template: "%s — TradeGX",
    },
    description: seo.description,
    keywords: [...seo.keywords],
    authors: [{ name: "TradeGX" }],
    creator: "TradeGX",
    openGraph: {
      type: "website",
      locale: seo.ogLocale,
      title: seo.title,
      description: seo.ogDescription,
      siteName: "TradeGX",
    },
    twitter: {
      card: "summary_large_image",
      title: "TradeGX",
      description: seo.twitterDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${grotesk.variable}`}
    >
      <body className="min-h-screen bg-background antialiased font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
