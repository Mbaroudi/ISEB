import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth/context";
import { QueryProvider } from "@/lib/providers/query-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ISEB - La compta qui vous fait gagner du temps",
  description:
    "Plateforme SaaS de gestion comptable pour indépendants et TPE. Tableau de bord en temps réel, expert-comptable dédié et automatisation intelligente.",
  keywords:
    "comptabilité, expert-comptable, SaaS, gestion, facturation, TPE, indépendant",
  authors: [{ name: "ISEB" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.iseb-accounting.fr",
    siteName: "ISEB",
    title: "ISEB - La compta qui vous fait gagner du temps",
    description:
      "Comme Dougs, mais en mieux. Tableau de bord en temps réel, expert-comptable dédié.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ISEB Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ISEB - La compta qui vous fait gagner du temps",
    description:
      "Plateforme SaaS de gestion comptable pour indépendants et TPE",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Alpine.js for animations and interactivity */}
        <Script
          src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
