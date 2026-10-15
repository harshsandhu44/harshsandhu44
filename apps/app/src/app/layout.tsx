import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import { site } from "@/content";
import "./globals.css";

// Archivo is only ever set italic, at the widest point of its width axis (see `disp`).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  style: "italic",
  axes: ["wdth"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}, ${site.role}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${hanken.variable}`}>
      <body className="bg-ink font-sans text-lg leading-normal">
        {/* The hero starts hidden for its GSAP intro (globals.css); without JS, show it. */}
        <noscript>
          <style>
            {
              "[data-hero-word],[data-gantry]{transform:none!important}[data-hero-fade]{opacity:1!important}"
            }
          </style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
