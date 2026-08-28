import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cn } from "@harshsandhu44/ui/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://harshsandhu.com"),
  title: {
    default: "Harsh Sandhu — Product Engineer",
    template: "%s — Harsh Sandhu",
  },
  description:
    "Product Engineer with 5+ years building SaaS platforms, internal tools and customer-facing products. React, Next.js, TypeScript, Node.js, AWS.",
  openGraph: {
    type: "website",
    siteName: "Harsh Sandhu",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", creator: "@harshsandhu44" },
};

export const viewport: Viewport = {
  themeColor: "#0B1410",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        GeistSans.variable,
        GeistMono.variable,
      )}
    >
      <body className="bg-ground text-silkscreen flex min-h-dvh flex-col">
        {children}
      </body>
    </html>
  );
}
