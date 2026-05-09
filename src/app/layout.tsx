import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TradeGX — Jurnal de Trading Profesional",
    template: "%s — TradeGX",
  },
  description:
    "Jurnalul de trading profesional pentru traderii SMC și ICT. Urmărește performanța, jurnalizează fiecare setup și lasă AI-ul să îți identifice edge-ul.",
  keywords: [
    "trading journal",
    "forex journal",
    "SMC trading",
    "ICT trading",
    "prop firm",
    "FTMO",
    "trading analytics",
    "lot size calculator",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ro"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
