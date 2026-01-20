import type { Metadata } from "next";
import { Inter, Playfair_Display, Oswald } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClientProviders } from "./client-providers";
import "../src/index.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-title",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RUNNING ERA | Club de Running Premium en Puebla",
  description: "RUNNING ERA es el club de running más exclusivo de Puebla. Comunidad, entrenamientos profesionales, eventos únicos y experiencias deportivas premium.",
  keywords: "running club Puebla, club de corredores, entrenamientos running, trail running Puebla, comunidad runners",
  authors: [{ name: "RUNNING ERA" }],
  openGraph: {
    title: "RUNNING ERA | Club de Running Premium en Puebla",
    description: "La nueva era del running en Puebla. Únete a nuestra comunidad exclusiva de corredores.",
    type: "website",
    url: "https://runningera.mx",
    images: ["https://runningera.mx/assets/logo-running-era.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@RunningEraMX",
    images: ["https://runningera.mx/assets/logo-running-era.png"],
  },
  icons: {
    icon: "/assets/logo-running-era.png",
    apple: "/assets/logo-running-era.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${oswald.variable}`} suppressHydrationWarning>
      <head>
        {/* DNS Prefetch y Preconnect para recursos externos */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload de recursos críticos */}
        <link rel="preload" href="/assets/logo-running-era.png" as="image" />
        <link rel="preload" href="/assets/hero-runners.jpg" as="image" />
        
        <link rel="icon" href="/assets/logo-running-era.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/logo-running-era.png" />
        <link rel="canonical" href="https://runningera.mx" />
        
        {/* CSS crítico inline para reducir render-blocking y mejorar LCP */}
        <style 
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
            /* CSS crítico para LCP - Hero section */
            .hero-critical {
              font-family: var(--font-title);
              font-weight: 700;
              color: white;
              opacity: 1 !important;
              transform: none !important;
              will-change: auto;
            }
            /* Prevenir layout shift */
            body {
              margin: 0;
              padding: 0;
            }
            /* Optimizar renderizado inicial */
            section[id="inicio"] {
              contain: layout style paint;
            }
          `
          }} 
        />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsClub",
              name: "RUNNING ERA",
              description: "Club de running premium en Puebla",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Puebla",
                addressCountry: "MX",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

