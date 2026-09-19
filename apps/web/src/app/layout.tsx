import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";
import { ClientErrorReporter } from "@/components/client-error-reporter";
import { Lumina } from "@/components/fx/lumina";
import { Reveal } from "@/components/fx/reveal";

const SEO = {
  ro: {
    title: "TradeGx — Jurnal de Trading Profesional",
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
      "jurnal prop firm",
      "provocare cont finantat",
      "backtesting strategii forex",
      "calculator lot forex",
      "academie trading română",
    ],
  },
  en: {
    title: "TradeGx — Professional Trading Journal",
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
      "prop firm journal",
      "funded account challenge",
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
      template: "%s — TradeGx",
    },
    description: seo.description,
    keywords: [...seo.keywords],
    authors: [{ name: "TradeGx" }],
    creator: "TradeGx",
    openGraph: {
      type: "website",
      locale: seo.ogLocale,
      title: seo.title,
      description: seo.ogDescription,
      siteName: "TradeGx",
    },
    twitter: {
      card: "summary_large_image",
      title: "TradeGx",
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
      {/* `tg-grain` pe <body>, nu doar pe dashboard: paginile publice (login,
          prețuri, share) arătau altfel decât interiorul aplicației fiindcă le
          lipsea exact stratul ăsta. Aceeași textură peste tot = un singur produs. */}
      <body className="min-h-screen bg-background antialiased font-sans tg-grain">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {/* Ascultă erorile de browser pe TOATE paginile, inclusiv cele
                publice: pe landing sau în formularul de înregistrare, o eroare
                costă un client care încă n-a devenit client. */}
            <ClientErrorReporter />
            {/* Lumina care urmărește cursorul și observatorul de intrare în
                cadru stau la rădăcină, nu doar în dashboard: cardurile de pe
                landing și de pe pagina de prețuri sunt primele pe care le vede
                cineva care încă nu e client. Amândouă sunt un singur ascultător
                și nu randează nimic. */}
            <Lumina />
            <Reveal />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
