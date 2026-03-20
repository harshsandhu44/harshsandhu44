import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { Crimson_Text } from "next/font/google";
import { GrainOverlay } from "@/components/grain-overlay";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { siteConfig } from "@/config/site";

import "./globals.css";

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-crimson-text",
  display: "swap",
});

// 1. Viewport Configuration (Separate export in Next.js 14+)
export const viewport: Viewport = {
  themeColor: "#111111", // Matches your dark background
  colorScheme: "light dark",
};

// 2. Metadata Configuration
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`, // Example: "Projects | Harsh Sandhu"
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: "Harsh Sandhu",
      url: siteConfig.url,
    },
  ],
  creator: "Harsh Sandhu",

  // Open Graph (Facebook, LinkedIn, Discord)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },

  // Twitter / X
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@harshsandhu", // Change to your handle
  },

  // Robots (Indexing)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Harsh Sandhu",
  url: "https://harshsandhu.com",
  sameAs: [
    "https://github.com/harshsandhu44",
    "https://linkedin.com/in/nyxfor13days",
    "https://twitter.com/harshsandhu44",
  ],
  jobTitle: "Product Engineer",
  description:
    "Product engineer building developer tools, simulation systems, and fast web products. Rust, Next.js, thoughtful design.",
  knowsAbout: [
    "Rust",
    "Next.js",
    "Developer Tools",
    "Simulation Systems",
    "TypeScript",
    "React",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@1,2&f[]=comico@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${GeistMono.variable} ${crimsonText.variable} font-sans`}>
        <SmoothScroll>
          <GrainOverlay />
          <AppHeader />
          <main>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
          </main>
          <AppFooter />
        </SmoothScroll>
      </body>
    </html>
  );
}
