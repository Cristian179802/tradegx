import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "TradeGX — Jurnal de Trading Profesional",
    template: "%s — TradeGX",
  },
  description:
    "Jurnalul de trading profesional pentru traderii SMC și ICT. Urmărește performanța, jurnalizează fiecare setup și lasă AI-ul să îți identifice edge-ul.",
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
  authors: [{ name: "TradeGX" }],
  creator: "TradeGX",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    title: "TradeGX — Jurnal de Trading Profesional",
    description:
      "Jurnalul de trading profesional pentru traderii SMC și ICT.",
    siteName: "TradeGX",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeGX",
    description: "Jurnal de trading profesional cu AI Coach",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
