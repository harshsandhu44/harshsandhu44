import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GrainOverlay } from "@/components/grain-overlay";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { siteConfig } from "@/config/site";
import "lenis/dist/lenis.css";
import "./globals.css";

// 1. Viewport Configuration (Separate export in Next.js 14+)
export const viewport: Viewport = {
  themeColor: "#111111", // Matches your dark background
  colorScheme: "dark",
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

  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
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
  ],
  jobTitle: "Senior Full-Stack Engineer",
  worksFor: {
    "@type": "Organization",
    name: "Magic EdTech",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@1,2&f[]=comico@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${GeistMono.variable}`}>
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
